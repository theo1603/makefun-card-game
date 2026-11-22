// Ember Court — a tiny static server for game/ (Node 22, standard library
// only), so the entry can be played locally without a build step:
// `node serve.ts` serves game/ on http://localhost:8080. It sends the MIME
// types a browser game needs, refuses any path outside game/, and otherwise
// does nothing clever: a development convenience, not a web server.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameRoot = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const portArg = process.argv.indexOf('--port');
const port = portArg === -1 ? 8080 : Number(process.argv[portArg + 1]) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wasm': 'application/wasm',
};

function resolveInside(requestPath) {
  const cleaned = normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, '');
  const target = resolve(join(gameRoot, cleaned === '/' ? 'index.html' : cleaned));
  if (target !== gameRoot && !target.startsWith(gameRoot + sep)) return null;
  return target;
}

createServer((request, response) => {
  let file;
  try {
    file = resolveInside(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('bad request');
    return;
  }
  if (!file) { response.writeHead(403).end('forbidden'); return; }
  let size;
  try {
    const info = statSync(file);
    if (!info.isFile()) throw new Error('not a file');
    size = info.size;
  } catch {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Ember Court is on http://localhost:${port}`);
});
