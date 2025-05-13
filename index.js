#!/usr/bin/env node
import process from 'node:process';
import pkg from './package.json' with { type: 'json' };

import { parseCliArgs } from './lib/parser.js';
import { staticsearch } from './staticsearch.js';


const
  // configuration
  config = [
    { env: null,                    cli: 'env',             prop: null,                     type: 'file',       help: 'load defaults from an .env file' },
    { env: 'BUILD_DIR',             cli: 'builddir',        prop: 'buildDir',               type: 'path',       help: 'directory containing static files (./build/)' },
    { env: 'SEARCH_DIR',            cli: 'searchdir',       prop: 'searchDir',              type: 'path',       help: 'index file directory (./build/search/)' },
    { env: 'SITE_DOMAIN',           cli: 'domain',          prop: 'siteDomain',             type: 'domain',     help: 'site domain if links use full URL (http://localhost)' },
    { env: 'BUILD_ROOT',            cli: 'root',            prop: 'buildRoot',              type: 'path',       help: 'site root path (/)' },
    { env: 'SITE_INDEXFILE',        cli: 'indexfile',       prop: 'siteIndexFile',          type: 'name',       help: 'default index file (index.html)' },
    { env: 'PAGE_DOMSELECTORS',     cli: 'dom',             prop: 'pageDOMSelectors',       type: 'nodelist',   help: 'comma-separated content DOM nodes (\'main\')' },
    { env: 'SITE_PARSEROBOTSFILE',  cli: 'robotfile',       prop: 'siteParseRobotsFile',    type: 'true|false', help: 'parse robot.txt Disallows (true)' },
    { env: 'SITE_PARSEROBOTSMETA',  cli: 'robotmeta',       prop: 'siteParseRobotsMeta',    type: 'true|false', help: 'parse robot meta noindex (true)' },
    { env: 'WORD_CROP',             cli: 'wordCrop',        prop: 'wordCrop',               type: 'int',        help: 'indexed maximum word length (7)' },
    { env: 'WEIGHT_TITLE',          cli: 'weighttitle',     prop: 'wordWeight.title',       type: 'num',        help: 'word weight for main title (10)' },
    { env: 'WEIGHT_DESCRIPTION',    cli: 'weightdesc',      prop: 'wordWeight.description', type: 'num',        help: 'word weight for description (8)' },
    { env: 'WEIGHT_H2',             cli: 'weighth2',        prop: 'wordWeight.h2',          type: 'num',        help: 'word weight for H2 headings (6)' },
    { env: 'WEIGHT_H3',             cli: 'weighth3',        prop: 'wordWeight.h3',          type: 'num',        help: 'word weight for H3 headings (5)' },
    { env: 'WEIGHT_H4',             cli: 'weighth4',        prop: 'wordWeight.h4',          type: 'num',        help: 'word weight for H4 headings (4)' },
    { env: 'WEIGHT_H5',             cli: 'weighth5',        prop: 'wordWeight.h5',          type: 'num',        help: 'word weight for H5 headings (3)' },
    { env: 'WEIGHT_H6',             cli: 'weighth6',        prop: 'wordWeight.h6',          type: 'num',        help: 'word weight for H6 headings (2)' },
    { env: 'WEIGHT_CONTENT',        cli: 'weightcontent',   prop: 'wordWeight.content',     type: 'num',        help: 'word weight for content (1)' },
    { env: 'WEIGHT_EMPHASIS',       cli: 'weightemphasis',  prop: 'wordWeight.emphasis',    type: 'num',        help: 'word weight for emphasis (1)' },
    { env: 'WEIGHT_ALT',            cli: 'weightalt',       prop: 'wordWeight.alt',         type: 'num',        help: 'word weight for alt tags (1)' },
    { env: 'WEIGHT_LINK',           cli: 'weightlink',      prop: 'wordWeight.link',        type: 'num',        help: 'word weight for inbound links (5)' },
    { env: null,                    cli: 'v',               prop: null,                     type: null,         help: 'show application version' },
    { env: null,                    cli: 'version',         prop: null,                     type: null,         help: 'show application version' },
    { env: null,                    cli: '?',               prop: null,                     type: null,         help: 'show help' },
    { env: null,                    cli: 'help',            prop: null,                     type: null,         help: 'show help' },
    { env: null,                    cli: 'helpenv',         prop: null,                     type: null,         help: 'show .env help' },
    { env: null,                    cli: 'helpapi',         prop: null,                     type: null,         help: 'show Node.js API help' },
  ],

  // parse CLI arguments
  opt = parseCliArgs(
    Object.fromEntries( config.filter(c => c.cli).map(c => [c.cli, null]) ),
    'builddir'
  );

// show version
if (opt.version || opt.v) {
  console.log(`${ pkg.version }`);
  process.exit(0);
}


// show CLI help
if (opt.help || opt['?']) {

  console.log(`StaticSearch creates a search index for static websites.
You can define options on the CLI, in environment variables, or the Node.js API.

CLI usage:  staticsearch [options]

StaticSearch options:

${ config.filter(c => c.cli).map(c => `  --${ (c.cli + (c.type ? ' <' + c.type + '>' : '')).padEnd(24) }${ c.help }`).join('\n') }

All options can use single dash (-), double dash (--), or "--name=value" format.
Examples:

  staticsearch -builddir=./dest/ --root /blog/ -indexfile default.htm
  staticsearch --domain http://site.com -searchdir=./build/find/

The first non-dashed parameter is presumed to be the build:

  staticsearch ./build/

`);

  process.exit(0);
}


// show .env help
if (opt.helpenv) {

  console.log(`You can set StaticSearch indexing parameters using environment variables.
These can also be defined in a file and loaded using --env <file>.

StaticSearch variables:

${ config.filter(c => c.env).map(c => `  ${ (c.env + (c.type ? '=<' + c.type + '>' : '')).padEnd(35) }${ c.help }`).join('\n') }

Example .env file:
BUILD_DIR=./dest/
SEARCH_DIR=./dest/index/
BUILD_ROOT=/blog/

Load using:

  staticsearch --env .env

Note that CLI arguments take precedence over environment variables.
`);

}


// show API help
if (opt.helpapi) {

  console.log(`You can use the Node.js API to index a static site.

Install the module:

  npm install staticsearch

Example code:

  import { staticsearch } from 'staticsearch';

  // configuration
  staticsearch.buildDir = './dest/';
  staticsearch.searchDir = './dest/index/';
  staticsearch.buildRoot = './blog/';

  // run index
  await staticsearch.index();

StaticSearch configuration properties:

${ config.filter(c => c.prop).map(c => `  staticsearch.${ (c.prop + (c.type ? ' = <' + c.type + '>;' : '')).padEnd(37) }${ c.help }`).join('\n') }

When a value is not defined, staticsearch uses environment variables where available.
`);

}


// load .env file
if (opt.env) {
  process.loadEnvFile(opt.env);
}


// set defaults
config.forEach(c => {

  if (!c.prop) return;

  let value = (c.cli ? opt[c.cli] : undefined) || (c.env ? process.env[c.env] : undefined);

  if (value) {

    value = value.trim();

    switch (c.type) {

      case 'int':
      case 'num':
        value = parseFloat(value);
        break;

      case 'true|false':
        value = value.toLowerCase();
        value = value !== 'false' && value !== '0';
        break;

      case 'nodelist':
        value = value.split(',').map(v => v.trim());
        break;

    }

    // set property
    const [p1,p2] = c.prop.split('.');

    if (p2) {
      staticsearch[ p1 ][ p2 ] = value;
    }
    else {
      staticsearch[ p1 ] = value;
    }

  }

});

await staticsearch.index();
