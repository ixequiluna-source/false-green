import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

/** A disposable, stateless fixture. It accepts no real orders and stores no data. */
export async function startShop(port = 0) {
  const html = await readFile(new URL('./index.html', import.meta.url));
  const server = createServer((req, res) => {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (path === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); return;
    }
    if (path === '/api/cart') { res.writeHead(200, {'Content-Type': 'application/json'}); res.end(JSON.stringify({total: 49, currency: 'USD'})); return; }
    if (path === '/hero.svg') {
      res.writeHead(200, {'Content-Type': 'image/svg+xml'});
      res.end('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><rect width="480" height="320" fill="#ddede4"/><ellipse cx="240" cy="267" rx="95" ry="13" fill="#b2cbbb"/><rect x="162" y="60" width="156" height="200" rx="28" fill="#326453"/><path d="M213 60V40h54v20" fill="none" stroke="#234338" stroke-width="12"/><text x="240" y="166" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="23">FIELD / 01</text></svg>'); return;
    }
    res.writeHead(404); res.end('Not found');
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not bind demo server');
  return { baseURL: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => { server.closeAllConnections(); server.close(error => error ? reject(error) : resolve()); }) };
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const server = await startShop(Number(process.env.PORT ?? '4177'));
  console.log(`Disposable demo: ${server.baseURL}`);
  const stop = async () => { await server.close(); process.exitCode = 0; };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}
