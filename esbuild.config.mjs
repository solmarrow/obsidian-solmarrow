import esbuild from 'esbuild';
import { builtinModules } from 'node:module';

await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian', 'electron', '@codemirror/*', '@lezer/*', ...builtinModules],
  format: 'cjs',
  target: 'es2020',
  logLevel: 'info',
  sourcemap: false,
  minify: false,
  treeShaking: true,
  outfile: 'main.js',
});
