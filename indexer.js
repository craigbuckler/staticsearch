import process from 'node:process';
import { readdir, readFile, cp } from 'node:fs/promises';
import { join, resolve, dirname, extname, sep } from 'node:path';
import { performance } from 'node:perf_hooks';

import { parseRobotsTxt, parseHTML } from './lib/parser.js';
import { writePath, deletePath } from './lib/file.js';
import { stemFilename, stemFunction, stopWords } from './lib/lang.js';
import { log } from './lib/log.js';

// search indexer
class StaticSearch {

  // configuration defaults
  #agent = 'staticsearch';
  #clientJS = ['staticsearch.js', 'staticsearch-bind.js', 'staticsearch-component.js'];
  #wordIndexChars = 2;
  #JSONspacing = '';

  language = process.env.LOCALE;
  wordCrop = process.env.WORDCROP;
  stopWords = process.env.STOPWORDS;
  buildDir = process.env.BUILD_DIR || './build/';
  searchDir = process.env.SEARCH_DIR || './build/search/';
  buildRoot = process.env.BUILD_ROOT || '/';
  siteDomain = process.env.SITE_DOMAIN || 'http://localhost';
  siteIndexFile = process.env.SITE_INDEXFILE || 'index.html';

  siteParseRobotsFile = (process.env.SITE_PARSEROBOTSFILE?.toLowerCase() !== 'false');
  siteParseRobotsMeta = (process.env.SITE_PARSEROBOTSMETA?.toLowerCase() !== 'false');

  pageDOMSelectors = (process.env.PAGE_DOMSELECTORS || 'main');
  pageDOMExclude = (process.env.PAGE_DOMEXCLUDE || 'nav');

  wordWeight = {
    title:        parseFloat(process.env.WEIGHT_TITLE  || 10),
    description:  parseFloat(process.env.WEIGHT_DESCRIPTION || 8),
    h2:           parseFloat(process.env.WEIGHT_H2 || 6),
    h3:           parseFloat(process.env.WEIGHT_H3 || 5),
    h4:           parseFloat(process.env.WEIGHT_H4 || 4),
    h5:           parseFloat(process.env.WEIGHT_H5 || 3),
    h6:           parseFloat(process.env.WEIGHT_H6 || 2),
    content:      parseFloat(process.env.WEIGHT_CONTENT || 1),
    emphasis:     parseFloat(process.env.WEIGHT_EMPHASIS || 2),
    alt:          parseFloat(process.env.WEIGHT_ALT || 1),
    link:         parseFloat(process.env.WEIGHT_LINK || 5)
  };

  // start indexing
  async index() {

    performance.mark('total indexing time:start');

    // resolved working directories
    const
      workingBuildDir = resolve(process.cwd(), this.buildDir),
      workingSearchDir = resolve(process.cwd(), this.searchDir),
      workingStaticSite = resolve( '/', dirname( import.meta.url.replace(/^[^/]*\/+/, '') ) );

    // set language, stem and stopword
    this.language = (this.language || 'en').trim().toLowerCase();
    this.wordCrop = Math.max(3, parseFloat(this.wordCrop) || 7);

    const
      stem = await stemFunction(this.language),
      stopword = await stopWords(this.language, this.wordCrop, this.stopWords);

    // parse robots.txt
    const robotsIgnore = await parseRobotsTxt(
      join(workingBuildDir, 'robots.txt'),
      this.#agent,
      this.siteParseRobotsFile
    );

    // parse DOM selectors
    if (!Array.isArray(this.pageDOMSelectors)) this.pageDOMSelectors = this.pageDOMSelectors.split(',');
    this.pageDOMSelectors = this.pageDOMSelectors.map(v => v.trim());

    // parse DOM exclusions
    if (!Array.isArray(this.pageDOMExclude)) this.pageDOMExclude = this.pageDOMExclude.split(',');
    this.pageDOMExclude = this.pageDOMExclude.map(v => v.trim());

    // find all HTML files and slugs
    let buildFile = (await readdir(workingBuildDir, { recursive: true }))
      .filter(f => extname(f).toLowerCase().includes('.htm'))
      .map(file => {

        // determine full filename and slug
        let slug = join( this.buildRoot, file );
        file = join(workingBuildDir, file);

        if (slug.endsWith( this.siteIndexFile )) {
          slug = dirname(slug);
          if (!slug.endsWith(sep)) slug += sep;
        }
        slug = slug.replace(sep, '/');

        return { file, slug };

      })
      .filter(f => {

        // remove files blocked by robots.txt
        let valid = true;
        robotsIgnore.forEach(r => valid &= !f.slug.startsWith(r));
        return valid;

      });


    // read and parse HTML files but remove any with:
    // <meta name="robots" content="noindex">
    // <meta name="staticsearch" content="noindex">
    performance.mark('parse HTML files:start');
    const robotRe = new RegExp(`<meta.*name=.*(robots|${ this.#agent }).*noindex`, 'i');

    (await Promise.allSettled(
      buildFile.map(f => readFile( f.file, { encoding: 'utf8' } ) )
    )).forEach((f, idx) => {

      if (f.value && (!this.siteParseRobotsMeta || !robotRe.test(f.value))) {

        const html = parseHTML(
          f.value,                // HTML string
          this.pageDOMSelectors,  // DOM selectors
          this.pageDOMExclude,    // DOM exclusions
          this.siteDomain,        // domain
          buildFile[idx].slug,    // slug
          this.siteIndexFile,     // index filename
          stem,                   // stem function
          stopword,               // stopword list
          this.wordCrop           // max word letters
        );

        if (html) {
          buildFile[idx].html = html;
        }
        else {
          log(`Unable to parse HTML in ${ buildFile[idx].file }`, 'warn');
        }

      }

    });

    // remove blocked/invalid files
    buildFile = buildFile.filter(f => f.html);

    if (!buildFile.length) {
      log(`no files available for indexing at ${ workingBuildDir }`);
      return;
    }

    // sort by slug
    buildFile.sort((a, b) => a.slug > b.slug ? 1 : -1);

    performance.mark('parse HTML files:end');
    performance.mark('word scoring:start');

    const
      pageMap = new Map( buildFile.map((p, i) => [p.slug, i]) ),
      pageIndex = [],
      wordIndex = new Map();

    // create search data stores
    buildFile.forEach((page, idx) => {

      // page data
      pageIndex[idx] = { u: page.slug, t: page.html.title, d: page.html.description };

      // title scores
      addWords( page.html.word.title, idx, this.wordWeight.title );

      // description scores
      addWords( page.html.word.description, idx, this.wordWeight.description );

      // content scores
      addWords( page.html.word.content, idx, this.wordWeight.content );

      // emphasis scores
      addWords( page.html.word.emphasis, idx, this.wordWeight.emphasis - this.wordWeight.content );

      // alt scores
      addWords( page.html.word.alt, idx, this.wordWeight.alt );

      // headings
      for (let h = 2; h <= 6; h++) {
        const hN = 'h' + h;
        addWords( page.html.word[hN], idx, this.wordWeight[hN] - this.wordWeight.content );
      }

      // inbound links
      page.html.link.forEach((words, slug) => {
        if (pageMap.has(slug)) addWords(words, pageMap.get(slug), this.wordWeight.link);
      });

      // add words to wordScore
      function addWords( words, pageIndex, score ) {

        words.forEach(word => {

          if (!wordIndex.has(word)) wordIndex.set(word, new Map());
          if (!wordIndex.get(word).get(pageIndex)) wordIndex.get(word).set(pageIndex, 0);
          wordIndex.get(word).set(pageIndex, wordIndex.get(word).get(pageIndex) + score);

        });

      }

    });

    performance.mark('word scoring:end');
    performance.mark('write index files:start');

    // output index files
    await deletePath(workingSearchDir);

    const
      wordList = [...wordIndex.keys()].sort(),
      wordFileList = [];

    let curFile = null, wordFile = [];

    while (wordList.length) {

      const nextFile = wordList.length && wordList[0].slice(0, this.#wordIndexChars);

      if (nextFile === curFile) {

        // get next item
        wordFile.push( wordList.shift() );

      }

      if (nextFile !== curFile || !wordList.length) {

        if (curFile && wordFile.length) {

          // output word file
          wordFileList.push(curFile);

          const wordOut = {};

          wordFile.forEach(w => {
            wordOut[w] = Object.fromEntries( wordIndex.get(w) );
          });

          await writePath(join(workingSearchDir, './data/', curFile + '.json'), JSON.stringify( wordOut, null, this.#JSONspacing ));

        }

        curFile = nextFile;
        wordFile = [];

      }

    }

    // page indexes
    await writePath(join(workingSearchDir, 'index.json'), JSON.stringify(
      {
        page: pageIndex,
        file: wordFileList,
        stopword: [...stopword]
      },
      null,
      this.#JSONspacing )
    );

    // copy stem files
    const wSearchDirStem = join(workingSearchDir, './stem/');
    await cp(join(workingStaticSite, './dist/stem/'), wSearchDirStem, { recursive: true, force: true } );

    // get stem file
    const stemImport = await stemFilename(wSearchDirStem, this.language);

    // copy and modify client code
    Promise.allSettled(
      this.#clientJS.map( async jsFile => {

        const clientJS = (await readFile( join(workingStaticSite, './dist/js/', jsFile), { encoding: 'utf8' } ))
          .replaceAll('__SSDIR__/', '')
          .replaceAll('__STEMFILE__', stemImport)
          .replaceAll('__AGENT__', this.#agent)
          .replaceAll('__FILENAME__', jsFile)
          .replaceAll('__VERSION__', Math.ceil( +new Date() / 60000))
          .replaceAll('__WORDCROP__', this.wordCrop);

        await writePath(join(workingSearchDir, jsFile), clientJS);

      })
    );

    // copy CSS files
    await cp(join(workingStaticSite, './dist/css/'), join(workingSearchDir, './css/'), { recursive: true, force: true } );

    performance.mark('write index files:end');

    performance.mark('total indexing time:end');

    this.#showMetrics();

    log(`indexing complete
       pages indexed: ${ String(pageIndex.length).padStart(5, ' ') }
        unique words: ${ String(wordIndex.size).padStart(5, ' ') }
         index files: ${ String(wordFileList.length + 1).padStart(5, ' ') }
    `,
    'info');
  }

  // log performance metrics
  #showMetrics() {

    const metrics = new Set(
      [...performance.getEntries()]
        .map( p => p.name.replace(/:(start|end)$/i, '') )
    );

    let msg = '';
    metrics.forEach(m => {

      const p = Math.ceil( performance.measure(m, m + ':start', m + ':end').duration );
      msg += m.padStart(20,' ') + ':' + String(p).padStart(6, ' ') + 'ms\n';

    });

    log(msg, 'info');

  }

}

export const staticsearch = new StaticSearch();
