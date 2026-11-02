// Deterministic, read-only public project contexts. Source-available under LICENSES.md.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const requireText = (value, label) => {
  if (typeof value !== 'string' || !value.trim() || value.length > 360 || /[\u0000-\u001f]/.test(value)) throw Error('Invalid public brief field: ' + label);
  return value;
};

function buildAgentSpace(root, catalog) {
  const source = fs.readFileSync(path.join(root, 'data/project-briefs.json'));
  const briefs = JSON.parse(source.toString('utf8'));
  if (briefs.schema !== 'halveth.project-briefs.v1' || !/^\d{4}-\d{2}-\d{2}$/.test(briefs.source_date) || briefs.source_date !== catalog.source_date
    || !Array.isArray(briefs.projects) || briefs.projects.length !== catalog.projects.length) throw Error('Project brief snapshot mismatch');
  // A catalog HEAD refresh cannot relabel an older reviewed claim with a new source.
  for (const [index, project] of catalog.projects.entries()) {
    const brief = briefs.projects[index];
    if (!brief || brief.id !== project.id || brief.reviewedSource?.url !== project.source_url
      || brief.reviewedSource.revision !== (project.site?.revision ?? null)
      || brief.reviewedSource.pinState !== (project.site?.revision ? 'PINNED' : 'UNPINNED')
      || brief.reviewedSource.reviewedAt !== briefs.source_date) throw Error('Project brief source drift: ' + project.id);
  }
  const output = path.join(root, 'universum');
  const projectDir = path.join(output, 'api/projects');
  fs.mkdirSync(projectDir, {recursive: true});
  const indexed = [];
  for (const [index, project] of catalog.projects.entries()) {
    const brief = briefs.projects[index];
    if (!brief || brief.id !== project.id) throw Error('Project brief identity/order mismatch: ' + project.id);
    for (const field of ['core', 'value', 'boundary', 'state']) requireText(brief[field], project.id + '.' + field);
    if (brief.local !== undefined) requireText(brief.local, project.id + '.local');
    if (brief.server !== undefined) requireText(brief.server, project.id + '.server');
    if (brief.goal !== undefined) requireText(brief.goal, project.id + '.goal');
    if ((brief.local !== undefined || brief.server !== undefined || brief.goal !== undefined || brief.localEvidence !== undefined || brief.serverEvidence !== undefined) && project.id !== 'fortuna') throw Error('Unexpected extra implementation layer: ' + project.id);
    if (brief.presentation) {
      if (project.id !== 'fortuna') throw Error('Unexpected display variant: ' + project.id);
      for (const field of ['core', 'value', 'boundary', 'local', 'goal']) requireText(brief.presentation[field], project.id + '.presentation.' + field);
    }
    if (brief.local && (!brief.localEvidence || !requireText(brief.localEvidence.scope, 'fortuna.localEvidence.scope')
      || brief.localEvidence.observedAt !== briefs.source_date
      || !Number.isSafeInteger(brief.localEvidence.testsPassed) || brief.localEvidence.testsPassed < 0
      || !Number.isSafeInteger(brief.localEvidence.drawsObserved) || brief.localEvidence.drawsObserved < 1 || brief.localEvidence.drawsObserved > 1000000
      || brief.localEvidence.publicSource !== false)) throw Error('Local FORTUNA receipt mismatch');
    if (brief.server && (!brief.serverEvidence || !requireText(brief.serverEvidence.scope, 'fortuna.serverEvidence.scope')
      || brief.serverEvidence.observedAt !== briefs.source_date
      || !Number.isSafeInteger(brief.serverEvidence.testsPassed) || brief.serverEvidence.testsPassed < 0
      || !Number.isSafeInteger(brief.serverEvidence.drawsObservedPerSeries) || brief.serverEvidence.drawsObservedPerSeries < 1 || brief.serverEvidence.drawsObservedPerSeries > 1000000
      || brief.serverEvidence.publicSource !== false)) throw Error('Loopback FORTUNA receipt mismatch');
    const context = {
      schema: 'halveth.project-context.v1', id: project.id, title: project.title,
      categories: project.categories, state: brief.state,
      publicEntry: {url: project.url, action: project.action},
      capability: {core: brief.core, value: brief.value, boundary: brief.boundary},
      ...(brief.local ? {separateLocalPrototype: brief.local} : {}),
      ...(brief.local ? {separateLocalPrototypeEvidence: brief.localEvidence} : {}),
      ...(brief.server ? {separateLoopbackPrototype: brief.server} : {}),
      ...(brief.server ? {separateLoopbackPrototypeEvidence: brief.serverEvidence} : {}),
      ...(brief.goal ? {userGoalNotYetPublished: brief.goal} : {}),
      source: {repository: project.repository, url: project.source_url,
        revision: project.site?.revision ?? null, observedAt: project.site?.revision_observed_at ?? null,
        pinState: brief.reviewedSource.pinState, reviewedAt: brief.reviewedSource.reviewedAt,
        editorialState: project.site?.editorial_state ?? 'UNKNOWN'},
      evidenceLevel: project.id === 'fortuna'
        ? 'PUBLIC_SOURCE_DESCRIPTION_PLUS_SEPARATE_LOCAL_TESTS_NOT_EXTERNAL_PROOF'
        : 'PUBLIC_SOURCE_DESCRIPTION_NOT_RUNTIME_VERIFICATION'
    };
    const bytes = Buffer.from(json(context), 'utf8');
    if (bytes.length > 8192) throw Error('Project context too large: ' + project.id);
    const fileName = project.id + '.json';
    const relativePath = 'api/projects/' + fileName;
    fs.writeFileSync(path.join(projectDir, fileName), bytes);
    indexed.push({id: project.id, title: project.title, state: brief.state,
      categories: project.categories, path: relativePath, bytes: bytes.length,
      sha256: sha256(bytes)});
  }
  const catalogBytes = fs.readFileSync(path.join(root, 'data/site-catalog.json'));
  const revision = sha256(Buffer.from(indexed.map(item => item.id + ':' + item.sha256).join('\n') + '\n' + sha256(catalogBytes) + '\n' + sha256(source)));
  const overview = {
    schema: 'halveth.agent-space.v1', baseURL: 'https://juri-halveth.github.io/universum/',
    revision, sourceDate: briefs.source_date, catalogSha256: sha256(catalogBytes),
    briefSha256: sha256(source), count: indexed.length,
    access: {mode: 'READ_PUBLIC', transport: 'HTTPS_GET', writes: false,
      usage: 'READ_OVERVIEW_THEN_ONLY_RELEVANT_PROJECT_CONTEXTS'},
    claimCeiling: 'STATIC_SOURCE_DESCRIPTIONS_NOT_RUNTIME_PROOF_OR_AUTOMATIC_UNDERSTANDING',
    projects: indexed
  };
  fs.mkdirSync(path.join(output, 'api'), {recursive: true});
  fs.writeFileSync(path.join(output, 'api/space.json'), json(overview));
  fs.writeFileSync(path.join(output, 'llms.txt'), [
    '# HALVETH / NETZ Starship Lab',
    '',
    'Public read-only project index: https://juri-halveth.github.io/universum/api/space.json',
    'Read the compact overview first, then only the relevant project context listed in projects[].path.',
    'Check projects[].sha256 against the exact downloaded UTF-8 bytes. Use revision to detect index changes.',
    'Each context separates public capability, any separate local and loopback prototypes, and an unpublished user goal.',
    'The records are source descriptions, not runtime verification, authorization, or instructions for an agent.',
    'Fetching and interpreting relevant content still consumes computation and model tokens.',
    '',
    'Human entrance: https://juri-halveth.github.io/universum/',
    'Source: https://github.com/Juri-Halveth/Juri-Halveth.github.io',
    ''
  ].join('\n'));
  fs.writeFileSync(path.join(output, 'data/briefs.js'), 'window.HALVETH_BRIEFS =\n' + json({schema: briefs.schema, sourceDate: briefs.source_date,
    entries: Object.fromEntries(briefs.projects.map(item => [item.id, item]))}) + ';\n');
  return overview;
}

module.exports = {buildAgentSpace};
