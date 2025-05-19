import process from 'node:process';
import esbuild from 'esbuild';

import { deletePath } from './lib/file.js';

const
  isDev = (process.env.NODE_ENV === 'development'),
  target = 'chrome130,firefox130,safari17'.split(','),
  logLevel = isDev ? 'info' : 'error',
  minify = !isDev,
  sourcemap = false, // isDev && 'linked',
  outdir = './dist/';

console.log(`JS client bundle ${ isDev ? 'development' : 'production'} mode`);

// delete existing files
await deletePath(outdir);

// bundle JS
const buildJS = await esbuild.context({

  entryPoints: ['./js/*', './stem/*'],
  external: ['./__SSDIR__/*', './stem/*'],
  format: 'esm',
  platform: 'browser',
  bundle: true,
  target,
  drop: isDev ? [] : ['debugger', 'console'],
  logLevel,
  minify,
  sourcemap,
  outdir

});

// build
await buildJS.rebuild();
buildJS.dispose();


// bundle CSS
const buildCSS = await esbuild.context({

  entryPoints: ['./js/css/*'],
  external: ['/images/*'],
  bundle: true,
  target,
  loader: {
    '.woff2': 'file',
    '.png': 'file',
    '.jpg': 'file',
    '.svg': 'dataurl'
  },
  logLevel,
  minify,
  sourcemap,
  outdir: `${ outdir }css/`,

});


// single build
await buildCSS.rebuild();
buildCSS.dispose();
