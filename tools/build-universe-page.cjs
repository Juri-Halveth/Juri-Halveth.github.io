'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'universum/template.html');
const destination = path.join(root, 'universum/index.html');
const html = fs.readFileSync(source, 'utf8').replace(/\r\n/g, '\n').trim() + '\n';
if (!html.includes('id="source-universe"') || !html.includes('/universum/app.js')) {
  throw new Error('The source-universe template is missing its app entry points.');
}
fs.writeFileSync(destination, html);
console.log(JSON.stringify({ state: 'SOURCE_UNIVERSE_PAGE_BUILT', route: '/universum/', source: 'universum/template.html' }));
