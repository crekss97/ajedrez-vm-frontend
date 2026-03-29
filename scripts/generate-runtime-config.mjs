import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const defaultApiUrl = 'http://localhost:3000/api';
const apiUrl = process.env.NG_APP_API_URL || defaultApiUrl;
const runtimeConfigPath = resolve(process.cwd(), 'public', 'runtime-config.js');

mkdirSync(resolve(process.cwd(), 'public'), { recursive: true });
writeFileSync(
  runtimeConfigPath,
  `window.__APP_CONFIG__ = ${JSON.stringify({ apiUrl }, null, 2)};\n`,
  'utf8',
);

console.log(`Runtime config generado en ${runtimeConfigPath} con apiUrl=${apiUrl}`);
