#!/usr/bin/env node
import pkg from './package.json' with { type: 'json' };
import process from 'node:process';
import { parseArgs, styleText } from 'node:util';

import { staticsearch } from './indexer.js';


const
  // option configuration
  config = [
    { env: null,                    cli: 'env',             clis: 'e',    prop: null,                     type: 'file',         default: null,                help: 'load defaults from an .env file' },
    { env: 'BUILD_DIR',             cli: 'builddir',        clis: 'b',    prop: 'buildDir',               type: 'path',         default: './build/',          help: 'directory containing static files' },
    { env: 'SEARCH_DIR',            cli: 'searchdir',       clis: 's',    prop: 'searchDir',              type: 'path',         default: './build/search/',   help: 'index file directory' },
    { env: 'SITE_DOMAIN',           cli: 'domain',          clis: 'd',    prop: 'siteDomain',             type: 'domain',       default: 'http://localhost',  help: 'site domain if links use full URL' },
    { env: 'BUILD_ROOT',            cli: 'root',            clis: 'r',    prop: 'buildRoot',              type: 'path',         default: '/',                 help: 'site root path' },
    { env: 'SITE_INDEXFILE',        cli: 'indexfile',       clis: 'i',    prop: 'siteIndexFile',          type: 'name',         default: 'index.html',        help: 'default index file' },
    { env: 'SITE_PARSEROBOTSFILE',  cli: 'ignorerobotfile', clis: 'f',    prop: 'siteParseRobotsFile',    type: 'true|false',   default: true,                help: 'parse robot.txt Disallows' },
    { env: 'SITE_PARSEROBOTSMETA',  cli: 'ignorerobotmeta', clis: 'm',    prop: 'siteParseRobotsMeta',    type: 'true|false',   default: true,                help: 'parse robot meta noindex' },
    { env: 'PAGE_DOMSELECTORS',     cli: 'dom',             clis: 'D',    prop: 'pageDOMSelectors',       type: 'str',          default: '',                  help: 'CSS selector: nodes to include' },
    { env: 'PAGE_DOMEXCLUDE',       cli: 'domx',            clis: 'X',    prop: 'pageDOMExclude',         type: 'str',          default: '',                  help: 'CSS selector: nodes to exclude' },
    { env: 'LANGUAGE',              cli: 'language',        clis: 'l',    prop: 'language',               type: 'str',          default: 'en',                help: 'language' },
    { env: 'WORDCROP',              cli: 'wordcrop',        clis: 'c',    prop: 'wordCrop',               type: 'num',          default: 7,                   help: 'crop word letters' },
    { env: 'STOPWORDS',             cli: 'stopwords',       clis: 'S',    prop: 'stopWords',              type: 'str',          default: null,                help: 'comma-separated list of stop words' },
    { env: 'WEIGHT_LINK',           cli: 'weightlink',      clis: '',     prop: 'wordWeight.link',        type: 'num',          default: 5,                   help: 'word weight for inbound links' },
    { env: 'WEIGHT_TITLE',          cli: 'weighttitle',     clis: '',     prop: 'wordWeight.title',       type: 'num',          default: 10,                  help: 'word weight for main title' },
    { env: 'WEIGHT_DESCRIPTION',    cli: 'weightdesc',      clis: '',     prop: 'wordWeight.description', type: 'num',          default: 8,                   help: 'word weight for description' },
    { env: 'WEIGHT_H2',             cli: 'weighth2',        clis: '',     prop: 'wordWeight.h2',          type: 'num',          default: 6,                   help: 'word weight for H2 headings' },
    { env: 'WEIGHT_H3',             cli: 'weighth3',        clis: '',     prop: 'wordWeight.h3',          type: 'num',          default: 5,                   help: 'word weight for H3 headings' },
    { env: 'WEIGHT_H4',             cli: 'weighth4',        clis: '',     prop: 'wordWeight.h4',          type: 'num',          default: 4,                   help: 'word weight for H4 headings' },
    { env: 'WEIGHT_H5',             cli: 'weighth5',        clis: '',     prop: 'wordWeight.h5',          type: 'num',          default: 3,                   help: 'word weight for H5 headings' },
    { env: 'WEIGHT_H6',             cli: 'weighth6',        clis: '',     prop: 'wordWeight.h6',          type: 'num',          default: 2,                   help: 'word weight for H6 headings' },
    { env: 'WEIGHT_EMPHASIS',       cli: 'weightemphasis',  clis: '',     prop: 'wordWeight.emphasis',    type: 'num',          default: 2,                   help: 'word weight for bold and italic' },
    { env: 'WEIGHT_ALT',            cli: 'weightalt',       clis: '',     prop: 'wordWeight.alt',         type: 'num',          default: 1,                   help: 'word weight for alt tags' },
    { env: 'WEIGHT_CONTENT',        cli: 'weightcontent',   clis: '',     prop: 'wordWeight.content',     type: 'num',          default: 1,                   help: 'word weight for content' },
    { env: 'LOGLEVEL',              cli: 'loglevel',        clis: 'L',    prop: 'logLevel',               type: 'num',          default: 2,                   help: 'logging verbosity' },
    { env: null,                    cli: 'version',         clis: 'v',    prop: null,                     type: null,           default: null,                help: 'show application version' },
    { env: null,                    cli: 'help',            clis: '?',    prop: null,                     type: null,           default: null,                help: 'show help' },
    { env: null,                    cli: 'helpenv',         clis: 'E',    prop: null,                     type: null,           default: null,                help: 'show .env/environment variable help' },
    { env: null,                    cli: 'helpapi',         clis: 'A',    prop: null,                     type: null,           default: null,                help: 'show Node.js API help' },
  ],
  helpLink = styleText(['cyanBright'], 'For full help, refer to https://staticsearch.com/');

// default options
let opt = { help: true };

// parse CLI arguments
try {

  const
    args = [...process.argv].slice(2),
    options = {};

  // build CLI options
  config.forEach(o => {
    options[o.cli] = {
      type: !o.type || o.type === 'true|false' ? 'boolean' : 'string'
    };
    if (o.clis) options[o.cli].short = o.clis;
  });

  // parse arguments
  const { values, positionals } = parseArgs({ args, options, strict: true, allowPositionals: true });

  // set build directory to first positional argument
  if (positionals.length == 1 && !values.builddir) values.builddir = positionals[0];

  opt = { ...values };

}
catch (err) {
  console.error( styleText(['redBright'], `Error parsing arguments: ${ err.message }`) );
}

// show version
if (opt.version) {
  console.log(`${ pkg.version }`);
}


// show CLI help
if (opt.help) {

  console.log(`
${ styleText(['yellowBright'], 'StaticSearch CLI help') }

StaticSearch is a search engine for static websites.
${ helpLink }

The indexer scans your site's built files and generates a directory of
JavaScript and JSON data. A search facility is then available on that
site without the need for server-side processing or a database.

Indexing options can be set on the CLI, in environment variables, or
the Node.js API.

CLI usage: ${ styleText(['whiteBright'], 'staticsearch') + styleText(['dim'], ' [options]') }

Options:

${
  config
    .filter(c => c.cli)
    .map(c => `  ${ (c.clis ? `-${ c.clis }, ` : '    ') }--${ c.cli.padEnd(15) }${ styleText(['dim'], (c.type && c.type !== 'true|false' ? ' <' + c.type + '>' : '').padEnd(13)) } ${ c.help } ${ c.default ? styleText(['dim'], `(${ c.default })`) : '' }`)
    .join('\n')
}

Examples:

  staticsearch --builddir ./dest/ --root /blog/ --indexfile default.htm
  staticsearch --domain http://site.com -s ./build/find/

The first non-dashed parameter is presumed to be the build directory:

  staticsearch ./dest/ --searchdir ./dest/search/

`);
}


// show .env help
if (opt.helpenv) {

  console.log(`
${ styleText(['yellowBright'], 'StaticSearch environment variable help') }

StaticSearch indexing options can be set using environment variables.
Variables can also be defined in a file and loaded with ${ styleText(['dim'], '--env <file>') }

Variables:

${ config
    .filter(c => c.env)
    .map(c => `  ${ c.env }${ styleText(['dim'], (c.type ? '=<' + c.type + '>' : '').padEnd(33 - c.env.length)) } ${ c.help } ${ c.default ? styleText(['dim'], `(${ c.default })`) : '' }`)
    .join('\n')
}
${ styleText(['green'], `
# Example .env file
BUILD_DIR=./dest/
SEARCH_DIR=./dest/index/
BUILD_ROOT=/blog/
`) }
Load using:

  ${ styleText(['whiteBright'], 'staticsearch') + styleText(['dim'], ' --env .env') }

Note that CLI arguments take precedence over environment variables.

${ helpLink }
`);
}


// show API help
if (opt.helpapi) {

  console.log(`
${ styleText(['yellowBright'], 'StaticSearch Node.js API help') }

You can use the Node.js API to programmatically index a static site.

Install the module into a Node.js project:

  ${ styleText(['whiteBright'], 'npm install staticsearch') }

Create a JavaScript file (such as index.js):
${ styleText(['green'], `
  // EXAMPLE CODE
  import { staticsearch } from 'staticsearch';

  // configuration
  staticsearch.buildDir = './dest/';
  staticsearch.searchDir = './dest/index/';
  staticsearch.buildRoot = './blog/';
  staticsearch.wordWeight.title = 20;

  // run indexer
  await staticsearch.index();
`) }
Then run it:

  ${ styleText(['whiteBright'], 'node index.js') }

staticsearch object configuration properties:

${ config
    .filter(c => c.prop)
    .map(c => `  ${ styleText(['green'], '.' + c.prop) }${ styleText(['dim'], (c.type ? ' = <' + c.type + '>;' : '').padEnd(35 - c.prop.length)) } ${ c.help } ${ c.default ? styleText(['dim'], `(${ c.type != 'num' && c.type != 'true|false' ? '\'' : ''}${ c.default }${ c.type != 'num' && c.type != 'true|false' ? '\'' : ''})`) : '' }`)
    .join('\n')
}

When a value is not defined, staticsearch falls back to an
environment variable then the default value ${ styleText(['dim'], '(shown in brackets)') }.

${ helpLink }
`);
}


// exit if version or help requested
if (opt.version || opt.help || opt.helpenv || opt.helpapi) {
  process.exit(0);
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

    switch (c.type) {

      case 'int':
      case 'num':
        value = parseFloat(value);
        break;

      case 'str':
        value = value.trim();
        break;

      case 'true|false':
        if (c.cli.startsWith('ignore')) value = !value;
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
