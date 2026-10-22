// Sirve dist/ en el puerto 4200 con CORS abierto para que el shell importe remoteEntry.js (equivale al nginx de la imagen).
import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const RAIZ = join(process.cwd(), 'dist');
const TIPOS = { '.js': 'text/javascript', '.css': 'text/css', '.map': 'application/json' };

createServer((req, res) => {
  const ruta = normalize(join(RAIZ, new URL(req.url ?? '/', 'http://x').pathname));
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!ruta.startsWith(RAIZ) || !existsSync(ruta) || extname(ruta) === '') {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TIPOS[extname(ruta)] ?? 'application/octet-stream' });
  createReadStream(ruta).pipe(res);
}).listen(4200, () => console.log('admin en http://localhost:4200/remoteEntry.js'));
