'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.SPACE_PORT || 4187);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid local preview port.');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.md':'text/plain; charset=utf-8','.pdf':'application/pdf'};
http.createServer((req,res) => {
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  let file;
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    if (name.split('/').some(p => p.startsWith('.'))) throw new Error('Hidden path');
    file = path.resolve(root, '.' + name);
    if (file !== root && !file.startsWith(root + path.sep)) throw new Error('Outside preview');
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const real = fs.realpathSync(file);
    if (!real.startsWith(root + path.sep)) throw new Error('Outside preview');
    const body = fs.readFileSync(real);
    res.writeHead(200, {'Content-Type':types[path.extname(real)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (_) {
    const fallback=path.join(root,'404.html');
    res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'});
    res.end(fs.existsSync(fallback)?fs.readFileSync(fallback):'Not found');
  }
}).listen(port, '127.0.0.1', () => console.log('Juris Space preview http://127.0.0.1:' + port));
