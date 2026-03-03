import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');

mkdirSync('dist', { recursive: true });
copyFileSync(
  join(__dirname, 'node_modules/sql.js/dist/sql-wasm.wasm'),
  join(__dirname, 'dist/sql-wasm.wasm'),
);

/** @type {esbuild.BuildOptions} */
const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  minify: !isWatch,
  logLevel: 'info',
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('[esbuild] watching for changes...');
} else {
  await esbuild.build(buildOptions);
}
