'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Pages actions use verified full commit pins and retain readable release labels', () => {
  const workflow = read('.github/workflows/pages.yml');
  const useLines = workflow.split(/\r?\n/).filter((line) => /^\s*- uses: /.test(line));
  assert.equal(useLines.length, 5);
  for (const line of useLines) {
    assert.match(line, /^\s*- uses: actions\/[a-z-]+@[0-9a-f]{40} # v[0-9]/);
  }
  assert.match(workflow, /pull_request:\n/);
  assert.doesNotMatch(workflow, /pull_request:\n\s+paths:/);
  assert.match(workflow, /if: github\.event_name != 'pull_request' && github\.ref == 'refs\/heads\/main'/);
});

test('Dependabot checks both npm packages and GitHub Actions on a weekly schedule', () => {
  const config = read('.github/dependabot.yml');
  assert.match(config, /package-ecosystem: github-actions[\s\S]*?interval: weekly/);
  assert.match(config, /package-ecosystem: npm[\s\S]*?interval: weekly/);
});

test('security policy defines reporting, scope, stop conditions, and no bounty promise', () => {
  const policy = read('SECURITY.md');
  for (const phrase of [
    'security@halveth.de',
    'does not currently operate a public bug-bounty program',
    'current, explicit authorization',
    'allowed methods',
    'rate limits',
    'time window',
    'data rules',
    'stop conditions',
    'Stop if sensitive data appears',
  ]) assert(policy.includes(phrase), phrase);
});

test('agent rules bind delegated security work to an exact scope and protect rights claims', () => {
  const rules = read('AGENTS.md');
  for (const phrase of [
    'The exact owner, hostname, application, API, and in-scope asset.',
    'Delegated agents inherit the same exact scope',
    'Delegation cannot broaden authorization.',
    'This repository does not currently offer a public bug-bounty program',
    'A hash, commit, or timestamp binds a byte state or Git event',
    'It does not enforce review or block merging',
  ]) assert(rules.includes(phrase), phrase);
});

test('three README guides link the same security and agent policies', () => {
  const editions = [
    ['README.md', '[Sicherheitsmeldung](SECURITY.md)', '[Arbeitsregeln für Agenten](AGENTS.md)'],
    ['README.en.md', '[Report a vulnerability](SECURITY.md)', '[Agent working rules](AGENTS.md)'],
    ['README.ru.md', '[Сообщить об уязвимости](SECURITY.md)', '[Правила работы агентов](AGENTS.md)'],
  ];
  for (const [file, securityLink, agentLink] of editions) {
    const text = read(file);
    assert(text.includes(securityLink), file);
    assert(text.includes(agentLink), file);
  }
});

test('CODEOWNERS clearly states that routing alone does not enforce review', () => {
  const owners = read('.github/CODEOWNERS');
  assert.match(owners, /Suggested reviewers only/);
  assert.match(owners, /branch protection or a ruleset/);
  assert(owners.includes('/SECURITY.md @Juri-Halveth'));
});
