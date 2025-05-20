import { stem } from './stem/__STEMFILE__';
import { wordSet } from '../lib/wordset.js';
import { PixDB } from 'pixdb';

class StaticSearch {

  static path = (new URL( import.meta.url )).pathname.replace('__FILENAME__', '');
  static dbName = '__AGENT__';
  static version = __VERSION__;
  static wordCrop = __WORDCROP__;

  #ready = false;       // initialized
  #db = null;           // indexedDB connector
  #stopword = null;     // stopword list
  fetchTimeout = 5000;  // network timeout

  constructor() {
    console.log('STATICSEARCH starting');
  }

  // initialize
  async init() {

    if (this.#ready) return true;

    this.#db = this.#db || await new PixDB(StaticSearch.dbName, 1, (init, oldVersion, newVersion) => {

      console.log(`upgrading database from ${ oldVersion } to ${ newVersion }`);

      switch (oldVersion) {

        case 0: {
          init.createObjectStore('cfg', { keyPath: 'name' });     // configuration
          init.createObjectStore('page', { keyPath: 'id' });      // page index
          init.createObjectStore('file', { keyPath: 'id' });      // word files
          init.createObjectStore('index', { keyPath: 'word' });   // word index
        }

      }

    });

    // no DB connection
    if (!this.#db?.isConnected) return false;

    // version changed?
    const version = await this.#db.get({ store: 'cfg', key: 'version'});

    console.log(`current version: ${ version?.value }, new version ${ StaticSearch.version } - ${ version?.value === StaticSearch.version ? 'reusing' : 'INIT' }`);

    if (version?.value === StaticSearch.version) {

      // get stopwords
      this.#stopword = new Set( (await this.#db.get({ store: 'cfg', key: 'stopword'}))?.value );

      this.#ready = true;
      return true;
    };

    // clear stores
    await Promise.allSettled([

      // update version
      this.#db.put({ store: 'cfg', item: { name: 'version', value: StaticSearch.version } }),

      // clear stores
      this.#db.clear({ store: 'page' }),
      this.#db.clear({ store: 'file' }),
      this.#db.clear({ store: 'index' })

    ]);

    // fetch index data
    const i = await this.#fetchJSON('index.json');
    if (i === null) return false;

    // write stopword data
    this.#stopword = new Set(i.stopword);
    await this.#db.put({ store: 'cfg', item: { name: 'stopword', value: i.stopword } }),

    // write page data
    await this.#db.add({
      store: 'page',
      item: i.page.map((p, id) => ({ id, url: p.u, title: p.t, description: p.d }))
    });

    // write file data
    await this.#db.add({
      store: 'file',
      item: i.file.map(id => ({ id, loaded: false }))
    });

    // initialization complete
    this.#ready = true;
    return true;

  }


  // search for words in string
  async find( input ) {

    if (!this.#ready) {
      throw new Error('StaticSearch failed to initialize');
    }

    const res = [], searchWords = [ ...this.wordList(input) ];

    console.log('[search] for:', searchWords);

    if (!searchWords.length) return res;

    // load indexes
    await Promise.allSettled(
      searchWords.map( w => this.loadIndex(w) )
    );

    console.log('[search] GETTING SCORES');

    // get page scores and calculate relevancy
    const rel = {};
    (await Promise.allSettled(
      searchWords.map( key => this.#db.get({ store: 'index', key }) )
    )).forEach(s => {
      if (s.value?.page) {

        for (const p in s.value.page) {
          rel[p] = rel[p] || 0;
          rel[p] += s.value.page[p];
        }

      }
    });

    // convert to a list of objects
    const page = [];
    for (const p in rel) {
      page.push( { id: p, relevancy: rel[p] } );
    }

    page.sort((a, b) => b.relevancy - a.relevancy);

    // sorted results array
    (await Promise.allSettled(
      page.map(p => this.#db.get({ store: 'page', key: parseFloat( p.id ) }) )
    )).forEach((pData, idx) => {

      if (!pData.value) return;

      res[idx] = pData.value;
      res[idx].relevancy = page[idx].relevancy;

    });

    // console.log(res);

    return res;

  }


  // return a normalized Set of search words
  wordList( words ) {

    return wordSet(
      words,
      stem,
      StaticSearch.wordCrop,
      this.#stopword
    );

  }


  // load and store a word index
  async loadIndex( word ) {

    if (!this.#ready) {
      throw new Error('StaticSearch failed to initialize');
    }

    word = word.toLowerCase().replace(/[^a-z]/g, '').slice(0, 2);
    if (!word) return;

    const wordNext = word.slice(0, word.length - 1) + String.fromCharCode(word.charCodeAt(word.length - 1) + 1);

    console.log(`[loadIndex] find ${ word } to ${ wordNext }`);

    // get unloaded files
    const file = (await this.#db.getAll({ store: 'file', lowerBound: word, upperBound: wordNext }))
      .filter(f => !f.loaded);

    if (!file.length) {
      return;
    }

    // load files
    const indexLoaded = [], indexWords = [];

    (await Promise.allSettled(
      file.map(f => this.#fetchJSON(`data/${ f.id }.json`))
    )).map((json, idx) => {

      if (json.value) {

        // indexes loaded
        indexLoaded.push( { id: file[idx].id, loaded: true } );

        // words loaded
        indexWords.push(
          ...Object.getOwnPropertyNames( json.value )
            .map(w => ({ word: w, page: json.value[w] }))
        );

      }

    });

    console.log('[loadIndex] write to DB');

    // update DB
    (await Promise.allSettled([

      this.#db.put({ store: 'file', item: indexLoaded }),
      this.#db.put({ store: 'index', item: indexWords })

    ] ));

    console.log('[loadIndex] COMPLETE');

  }


  // fetch data
  async #fetchJSON( datafile ) {

    const uri = StaticSearch.path + datafile;

    console.log(`Fetch JSON: ${ uri }`);

    try {

      const
        controller = new AbortController(),
        timer = setTimeout(() => controller.abort(), this.fetchTimeout),
        res = await fetch(uri, {
          signal: controller.signal
        });

      clearTimeout(timer);

      if (!res.ok) throw new Error(`Fetch failed ${ uri }: ${ res.status }`);

      const json = await res.json();
      return json;

    }
    catch (e) {
      console.error(e.message);
      return null;
    }

  }

}

const staticsearch = new StaticSearch();
await staticsearch.init();
export { staticsearch };
