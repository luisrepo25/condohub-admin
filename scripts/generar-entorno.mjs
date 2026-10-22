// Escribe src/entorno.ts con la URL del gateway (VITE_GATEWAY_URL del entorno o de .env). Se ejecuta antes de build/test.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

let url = process.env.VITE_GATEWAY_URL;
if (!url && existsSync('.env')) {
  const linea = readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('VITE_GATEWAY_URL='));
  url = linea?.slice('VITE_GATEWAY_URL='.length).trim();
}
writeFileSync(
  'src/entorno.ts',
  `// Generado por scripts/generar-entorno.mjs; no se edita ni se sube.\nexport const GATEWAY_URL = ${JSON.stringify(url || 'http://localhost:8080')};\n`,
);
