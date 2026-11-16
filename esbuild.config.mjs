import esbuild from 'esbuild';
import builtins from 'builtin-modules';

await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian', 'electron', '@codemirror/*', '@lezer/*', ...builtins],
  format: 'cjs',
  target: 'es2020',
  logLevel: 'info',
  sourcemap: false,
  minify: false,
  treeShaking: true,
  outfile: 'main.js',
});
