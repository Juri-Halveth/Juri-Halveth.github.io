#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HALVETH PULSAR ONE ROOT: read-only snapshot of all owned GitHub repository trees.

Fetches repository metadata, EVERY branch and tag reference, and the complete
path tree behind each reference where GitHub returns it. Any uncollected or
truncated portion remains explicitly visible as incomplete.

No files are downloaded from repositories; no commands from GitHub are run.
The output is a local HTML viewer with inlined, DOM-escaped metadata.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from html import escape
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

OWNER = 'Juri-Halveth'
VERSION = '1.0.1'
API = 'https://api.github.com'
USER_AGENT = 'HALVETH-PULSAR-OneRoot/1.0.1 (read-only tree navigator)'
PAGE_SIZE = 100
# Not a silent coverage cutoff: reaching this fails with a visible warning.
MAX_PAGES = 1000


class APIError(Exception):
    pass


class GitHubReader:
    """Read only: gh api where available, otherwise public REST GET."""

    def __init__(self, public_only: bool = False, use_cli: bool | None = None):
        self.public_only = public_only
        self.cli = False
        if use_cli is None:
            use_cli = shutil.which('gh') is not None
        if use_cli:
            try:
                result = subprocess.run(
                    ['gh', 'auth', 'status', '--active'], capture_output=True,
                    text=True, timeout=25, check=False,
                )
                self.cli = result.returncode == 0
            except (OSError, subprocess.TimeoutExpired):
                self.cli = False
        self.authenticated = self.cli
        self.requests = 0

    def get(self, path: str):
        """Fetch GitHub JSON only. No GitHub-supplied content is executed."""
        self.requests += 1
        if self.cli:
            result = subprocess.run(
                ['gh', 'api', '-X', 'GET', '-H', 'Accept: application/vnd.github+json', path],
                capture_output=True, text=True, timeout=180, check=False,
            )
            if result.returncode != 0:
                # Deliberately avoid printing stderr, which can contain local details.
                raise APIError('GitHub CLI GET failed; check gh auth status or rate limit')
            content = result.stdout
        else:
            url = API + path
            req = urllib.request.Request(url, headers={
                'Accept': 'application/vnd.github+json',
                'User-Agent': USER_AGENT,
            }, method='GET')
            try:
                with urllib.request.urlopen(req, timeout=55) as response:
                    content = response.read().decode('utf-8')
            except urllib.error.HTTPError as e:
                raise APIError(f'GitHub REST GET failed: HTTP {e.code}') from e
            except urllib.error.URLError as e:
                raise APIError('GitHub REST connection failed') from e
        try:
            return json.loads(content)
        except (json.JSONDecodeError, ValueError) as e:
            raise APIError('GitHub response was not valid JSON') from e


def list_pages(reader, path: str):
    """Follow numbered pages until GitHub returns an incomplete or empty page."""
    collected = []
    for page in range(1, MAX_PAGES + 1):
        sep = '&' if '?' in path else '?'
        batch = reader.get(f'{path}{sep}per_page={PAGE_SIZE}&page={page}')
        if not isinstance(batch, list):
            raise APIError('Expected GitHub paginated array')
        collected.extend(batch)
        if len(batch) < PAGE_SIZE:
            return collected
    raise APIError('GitHub pagination is incomplete: MAX_PAGES reached')


def repo_catalog(reader: GitHubReader, owner: str = OWNER):
    if reader.authenticated and not reader.public_only:
        # Any available collaborator/owner repository is eligible, filtered by owner.
        endpoint = '/user/repos?affiliation=owner,collaborator,organization_member'
    else:
        endpoint = f'/users/{urllib.parse.quote(owner)}/repos?type=all'
    all_repos = list_pages(reader, endpoint)
    own = []
    for r in all_repos:
        if r.get('owner', {}).get('login', '').lower() != owner.lower():
            continue
        if r.get('private', False) and reader.public_only:
            continue
        own.append({
            'name': r['name'],
            'private': bool(r.get('private', False)),
            'defaultBranch': r.get('default_branch') or '',
            'url': f'https://github.com/{owner}/{urllib.parse.quote(r["name"])}',
            'description': (r.get('description') or '')[:300],
        })
    return sorted(own, key=lambda x: x['name'].casefold())


def refs_for_repo(reader, owner: str, repo: str, with_tags: bool):
    base = f'/repos/{urllib.parse.quote(owner)}/{urllib.parse.quote(repo)}'
    branches = list_pages(reader, f'{base}/branches')
    refs = [
        {'name': x['name'], 'kind': 'BRANCH', 'revision': x.get('commit', {}).get('sha', '')}
        for x in branches
    ]
    if with_tags:
        tags = list_pages(reader, f'{base}/tags')
        refs.extend(
            {'name': x['name'], 'kind': 'TAG', 'revision': x.get('commit', {}).get('sha', '')}
            for x in tags
        )
    return refs


def normalize_nodes(nodes):
    result = {}
    for node in nodes:
        name = node.get('path')
        kind = node.get('type')
        if not isinstance(name, str) or not name or kind not in ('tree', 'blob', 'commit'):
            continue
        result[name] = {
            'path': name,
            'kind': 'DIR' if kind == 'tree' else ('SUBMODULE' if kind == 'commit' else 'FILE'),
        }
    return [result[k] for k in sorted(result, key=lambda x: x.casefold())]


def complete_tree(reader, owner: str, repo: str, ref: str):
    """Get recursive tree; if truncated by GitHub, crawl each subtree by SHA."""
    base = f'/repos/{urllib.parse.quote(owner)}/{urllib.parse.quote(repo)}/git/trees/'
    encoded_ref = urllib.parse.quote(ref, safe='')
    response = reader.get(base + encoded_ref + '?recursive=1')
    if not isinstance(response, dict) or not isinstance(response.get('tree'), list):
        raise APIError('Git tree response missing tree array')
    root_sha = response.get('sha') or ''
    if not response.get('truncated', False):
        return {'rootSha': root_sha, 'coverage': 'COMPLETE', 'nodes': normalize_nodes(response['tree']), 'error': None}

    # GitHub REST recursive tree occasionally truncates. Expand from root
    # with GET-only subtree requests, rather than silently dropping paths.
    if not root_sha:
        return {'rootSha': '', 'coverage': 'PARTIAL_TRUNCATED', 'nodes': normalize_nodes(response['tree']),
                'error': 'GitHub returned a truncated tree without its root SHA'}

    paths = []
    pending = [('', root_sha)]
    seen_trees = set()
    try:
        while pending:
            prefix, tree_sha = pending.pop()
            if (prefix, tree_sha) in seen_trees:
                continue
            seen_trees.add((prefix, tree_sha))
            subtree = reader.get(base + urllib.parse.quote(tree_sha, safe=''))
            if not isinstance(subtree.get('tree'), list) or subtree.get('truncated'):
                raise APIError('Non-recursive subtree response was incomplete')
            for node in subtree['tree']:
                path = node.get('path')
                if not isinstance(path, str):
                    continue
                full = f'{prefix}/{path}' if prefix else path
                paths.append({'path': full, 'type': node.get('type')})
                if node.get('type') == 'tree' and node.get('sha'):
                    pending.append((full, node['sha']))
    except APIError as e:
        return {'rootSha': root_sha, 'coverage': 'PARTIAL_TRUNCATED', 'nodes': normalize_nodes(paths),
                'error': str(e)}
    return {'rootSha': root_sha, 'coverage': 'COMPLETE_RECOVERED', 'nodes': normalize_nodes(paths), 'error': None}


def collect(reader, owner=OWNER, with_tags=True, progress=print):
    repos = repo_catalog(reader, owner)
    manifest = {
        'schema': 'halveth.pulsar.one-root.v1',
        'version': VERSION,
        'owner': owner,
        'recordedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'accessMode': 'AUTHENTICATED_GH' if reader.authenticated else 'PUBLIC_ONLY',
        'discoveryScope': 'PUBLIC_REPOSITORIES_ONLY' if reader.public_only else 'ALL_ACCESSIBLE_OWNED_REPOS',
        'trees': {},
        'repositories': repos,
        'errors': [],
        'requests': 0,
    }
    ref_cache = {}
    for index, repo in enumerate(repos, start=1):
        name = repo['name']
        progress(f'[{index}/{len(repos)}] {name}: references ...')
        repo['refs'] = []
        try:
            refs = refs_for_repo(reader, owner, name, with_tags)
        except APIError as error:
            repo['coverage'] = 'REFERENCES_UNAVAILABLE'
            repo['error'] = str(error)
            manifest['errors'].append({'repo': name, 'stage': 'REFS', 'reason': str(error)})
            continue
        repo['coverage'] = 'REFERENCES_COLLECTED'
        for ref_index, ref in enumerate(refs, start=1):
            if len(refs) > 1:
                progress(f'  ↳ {ref_index}/{len(refs)} {ref["kind"]}: {ref["name"]}')
            # Same revision within one repository need not be refetched.
            key = (name, ref['revision']) if ref['revision'] else (name, ref['kind'], ref['name'])
            if key in ref_cache:
                ref['treeKey'] = ref_cache[key]
                repo['refs'].append(ref)
                continue
            try:
                tree = complete_tree(reader, owner, name, ref['name'])
                tree_id = f'{len(manifest["trees"]) + 1:06d}'
                manifest['trees'][tree_id] = tree
                ref['treeKey'] = tree_id
                ref_cache[key] = tree_id
                if tree['coverage'].startswith('PARTIAL'):
                    manifest['errors'].append({'repo': name, 'ref': ref['name'], 'stage': 'TREE', 'reason': tree['error'] or 'TRUNCATED'})
            except APIError as error:
                ref['treeKey'] = None
                ref['error'] = str(error)
                manifest['errors'].append({'repo': name, 'ref': ref['name'], 'stage': 'TREE', 'reason': str(error)})
            repo['refs'].append(ref)
    manifest['requests'] = reader.requests
    return manifest


def render_html(manifest, template: str):
    """Embed JSON as inert script data; protect HTML parser against path names."""
    raw = json.dumps(manifest, ensure_ascii=False, separators=(',', ':'))
    # Avoid script tag breakout even for arbitrary Git path names.
    raw = raw.replace('&', '\\u0026').replace('<', '\\u003c').replace('>', '\\u003e')
    raw = raw.replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    needle = '/*__PULSAR_MANIFEST__*/'
    if needle not in template:
        raise ValueError('HTML template manifest marker missing')
    return template.replace(needle, raw)


def write_result(manifest, output_dir: Path, template: str):
    output_dir.mkdir(parents=True, exist_ok=True)
    html_path = output_dir / 'HALVETH_PULSAR_ROOT.html'
    json_path = output_dir / 'HALVETH_PULSAR_ROOT_MANIFEST.json'
    # Temp files followed by atomic replace; never partially overwrite a valid tree.
    html_temp = html_path.with_suffix('.html.part')
    json_temp = json_path.with_suffix('.json.part')
    html_temp.write_text(render_html(manifest, template), encoding='utf-8')
    json_temp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    html_temp.replace(html_path)
    json_temp.replace(json_path)
    return html_path, json_path


def main(argv=None):
    # Windows consoles often use a legacy code page. Keep progress output from
    # aborting the read-only collection when a repository/ref contains Unicode.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, 'reconfigure'):
            stream.reconfigure(errors='backslashreplace')
    parser = argparse.ArgumentParser(description='HALVETH: one-click entire GitHub root tree, read only')
    parser.add_argument('--owner', default=OWNER, help='GitHub owner; defaults to Juri-Halveth')
    parser.add_argument('--public-only', action='store_true', help='Never access private repositories')
    parser.add_argument('--no-tags', action='store_true', help='Skip tag refs when a faster branch-only run is desired')
    parser.add_argument('--no-browser', action='store_true', help='Do not automatically open result')
    parser.add_argument('--out', type=Path, default=None, help='Local output folder')
    args = parser.parse_args(argv)
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9-]{0,38}', args.owner):
        parser.error('Owner must be a GitHub login')
    output = args.out or Path(os.environ.get('LOCALAPPDATA') or str(Path.home() / '.local' / 'share')) / 'HALVETH' / 'PULSAR'
    template = (Path(__file__).parent / 'pulsar_view.html').read_text(encoding='utf-8')
    reader = GitHubReader(public_only=args.public_only)
    mode = 'PUBLIC_ONLY via authenticated gh' if args.public_only and reader.authenticated else (
        'PUBLIC_ONLY via REST' if args.public_only else 'gh AUTHENTICATED' if reader.authenticated else 'PUBLIC REST'
    )
    print(f'PULSAR ROOT | OWNER {args.owner} | MODE {mode}')
    if not reader.authenticated:
        print('NOTICE: only public repositories are visible. To include private roots: install gh CLI and run gh auth login.')
    try:
        manifest = collect(reader, args.owner, not args.no_tags)
    except APIError as error:
        print(f'ERROR: {error}', file=sys.stderr)
        return 1
    html, json_path = write_result(manifest, output, template)
    print('\nPULSAR ROOT COMPLETE')
    print('  repositories:', len(manifest['repositories']))
    print('  references:', sum(len(r.get('refs', [])) for r in manifest['repositories']))
    print('  distinct path trees:', len(manifest['trees']))
    print('  warnings / incomplete edges:', len(manifest['errors']))
    print('  request count:', manifest['requests'])
    print('  private roots:', sum(r['private'] for r in manifest['repositories']))
    print('  HTML:', html)
    print('  MANIFEST:', json_path)
    print('  PRIVACY: files remain on this computer; do not publish if private roots are present')
    if not args.no_browser:
        webbrowser.open(html.resolve().as_uri())
    return 0


if __name__ == '__main__':
    sys.exit(main())
