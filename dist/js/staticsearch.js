// js/staticsearch.js
import { stem } from "./stem/__STEMFILE__";

// node_modules/pixdb/dist/pixdb.js
var a = class {
  #t = null;
  #r = null;
  #n = null;
  constructor(t, e, r) {
    return this.#r = t || "db", this.#n = e || 1, this.#i(r);
  }
  connect() {
    return this.#i().then(() => true).catch(() => false);
  }
  close() {
    this.#t.close(), this.#t = null;
  }
  #i(t) {
    return new Promise((e, r) => {
      if (!("indexedDB" in window)) {
        r(new Error("No indexedDB support"));
        return;
      }
      let s = indexedDB.open(this.#r, this.#n);
      s.onsuccess = () => {
        this.#t = s.result, e(this);
      }, s.onerror = (n) => {
        r(new Error(`IndexedDB error ${n.target.errorCode}: ${n.target.message}`, { cause: n }));
      }, t && (s.onupgradeneeded = (n) => {
        t(s.result, n.oldVersion, n.newVersion);
      });
    });
  }
  get isConnected() {
    return !!this.#t;
  }
  get name() {
    return this.#r;
  }
  get version() {
    return this.#n;
  }
  #u(t, e, r) {
    return new Promise((s, n) => {
      let { transaction: i, store: u } = this.#o(t, null, true);
      i.oncomplete = () => s(), i.onerror = (o) => {
        n(new Error(o.target.error.message, { cause: o }));
      }, e = Array.isArray(e) ? e : [e], e.forEach((o) => {
        r ? u.put(o) : u.add(o);
      }), i.commit();
    });
  }
  add({ store: t, item: e = [] } = {}) {
    return this.#u(t, e, false);
  }
  put({ store: t, item: e = [] } = {}) {
    return this.#u(t, e, true);
  }
  #e(t, e, r, s) {
    return new Promise((n, i) => {
      s = Array.isArray(s) ? s : [s];
      let u = r === "delete" || r === "clear", o = this.#o(t, e, u).store[r](...s);
      o.onsuccess = () => n(o.result), o.onerror = () => i(o.error ?? false);
    });
  }
  count({ store: t, index: e, lowerBound: r, upperBound: s } = {}) {
    return this.#e(t, e, "count", this.#s(r, s));
  }
  get({ store: t, index: e, key: r } = {}) {
    return this.#e(t, e, "get", r);
  }
  getAll({ store: t, index: e, lowerBound: r, upperBound: s, count: n } = {}) {
    return this.#e(t, e, "getAll", [this.#s(r, s), n]);
  }
  getAllKeys({ store: t, index: e, lowerBound: r, upperBound: s, count: n } = {}) {
    return this.#e(t, e, "getAllKeys", [this.#s(r, s), n]);
  }
  delete({ store: t, key: e } = {}) {
    return this.#e(t, null, "delete", [e]);
  }
  deleteAll({ store: t, index: e, lowerBound: r, upperBound: s } = {}) {
    return this.#e(t, e, "delete", [this.#s(r, s)]);
  }
  clear({ store: t } = {}) {
    return this.#e(t, null, "clear");
  }
  getCursor({ store: t, index: e, lowerBound: r, upperBound: s, direction: n = "next", callback: i } = {}) {
    return new Promise((u, o) => {
      let l = this.#o(t, e).store.openCursor(this.#s(r, s), n);
      l.onsuccess = () => {
        let c = l.result;
        c ? c.advance(i && i(c) || 1) : u(true);
      }, l.onerror = () => o(l.error);
    });
  }
  drop() {
    return new Promise((t, e) => {
      this.close();
      let r = indexedDB.deleteDatabase(this.#r);
      r.onsuccess = () => {
        this.#r = null, this.#n = null, t(true);
      }, r.onerror = () => e(false);
    });
  }
  #o(t, e, r) {
    let s = this.#t.transaction(t, r ? "readwrite" : "readonly", { durability: r ? "strict" : "default" }), n = s.objectStore(t);
    return { transaction: s, store: e && !r ? n.index(e) : n };
  }
  #s(t, e) {
    let r;
    return t && e ? r = IDBKeyRange.bound(t, e) : t ? r = IDBKeyRange.lowerBound(t) : e && (r = IDBKeyRange.upperBound(e)), r;
  }
};

// js/staticsearch.js
var StaticSearch = class _StaticSearch {
  static path = new URL(import.meta.url).pathname.replace("__FILENAME__", "");
  static dbName = "__AGENT__";
  static version = __VERSION__;
  static wordCrop = __WORDCROP__;
  #ready = false;
  // initialized
  #db = null;
  // indexedDB connector
  #stopword = null;
  // stopword list
  #debounce = null;
  // search debounce
  inputDebounce = 500;
  // default debounce value
  inputMinChars = 2;
  // characters required before search occurs
  fetchTimeout = 5e3;
  // network timeout
  constructor() {
    console.log("STATICSEARCH starting");
  }
  // initialize
  async init() {
    if (this.#ready) return true;
    this.#db = this.#db || await new a(_StaticSearch.dbName, 1, (init, oldVersion, newVersion) => {
      console.log(`upgrading database from ${oldVersion} to ${newVersion}`);
      switch (oldVersion) {
        case 0: {
          init.createObjectStore("cfg", { keyPath: "name" });
          init.createObjectStore("page", { keyPath: "id" });
          init.createObjectStore("file", { keyPath: "id" });
          init.createObjectStore("index", { keyPath: "word" });
        }
      }
    });
    if (!this.#db?.isConnected) return false;
    const version = await this.#db.get({ store: "cfg", key: "version" });
    console.log(`current version: ${version?.value}, new version ${_StaticSearch.version} - ${version?.value === _StaticSearch.version ? "reusing" : "INIT"}`);
    if (version?.value === _StaticSearch.version) {
      this.#stopword = new Set((await this.#db.get({ store: "cfg", key: "stopword" }))?.value);
      this.#ready = true;
      return true;
    }
    ;
    await Promise.allSettled([
      // update version
      this.#db.put({ store: "cfg", item: { name: "version", value: _StaticSearch.version } }),
      // clear stores
      this.#db.clear({ store: "page" }),
      this.#db.clear({ store: "file" }),
      this.#db.clear({ store: "index" })
    ]);
    const i = await this.#fetchJSON("index.json");
    if (i === null) return false;
    this.#stopword = new Set(i.stopword);
    await this.#db.put({ store: "cfg", item: { name: "stopword", value: i.stopword } }), // write page data
    await this.#db.add({
      store: "page",
      item: i.page.map((p, id) => ({ id, url: p.u, title: p.t, description: p.d }))
    });
    await this.#db.add({
      store: "file",
      item: i.file.map((id) => ({ id, loaded: false }))
    });
    this.#ready = true;
    return true;
  }
  // search for words in string
  async search(input) {
    if (!this.#ready) {
      throw new Error("StaticSearch failed to initialize");
    }
    const res = [], wordSet = [...this.#wordSet(input)];
    console.log("[search] for:", wordSet);
    if (!wordSet.length) return res;
    await Promise.allSettled(
      wordSet.map((w) => this.loadIndex(w))
    );
    console.log("[search] GETTING SCORES");
    const rel = {};
    (await Promise.allSettled(
      wordSet.map((key) => this.#db.get({ store: "index", key }))
    )).forEach((s) => {
      if (s.value?.page) {
        for (const p in s.value.page) {
          rel[p] = rel[p] || 0;
          rel[p] += s.value.page[p];
        }
      }
    });
    const page = [];
    for (const p in rel) {
      page.push({ id: p, relevancy: rel[p] });
    }
    page.sort((a2, b) => b.relevancy - a2.relevancy);
    (await Promise.allSettled(
      page.map((p) => this.#db.get({ store: "page", key: parseFloat(p.id) }))
    )).forEach((pData, idx) => {
      if (!pData.value) return;
      res[idx] = pData.value;
      res[idx].relevancy = page[idx].relevancy;
    });
    return res;
  }
  // extract unique stemmed words
  #wordSet(str) {
    return new Set(
      str.toLowerCase().replace(/[^a-z\s]/g, " ").trim().split(/\s+/g).map((w) => stem(w).slice(0, _StaticSearch.wordCrop)).filter((w) => w.length > 1 && !this.#stopword.has(w))
    );
  }
  // load and store a word index
  async loadIndex(word) {
    if (!this.#ready) {
      throw new Error("StaticSearch failed to initialize");
    }
    word = word.toLowerCase().replace(/[^a-z]/g, "").slice(0, 2);
    if (!word) return;
    const wordNext = word.slice(0, word.length - 1) + String.fromCharCode(word.charCodeAt(word.length - 1) + 1);
    console.log(`[loadIndex] find ${word} to ${wordNext}`);
    const file = (await this.#db.getAll({ store: "file", lowerBound: word, upperBound: wordNext })).filter((f) => !f.loaded);
    if (!file.length) {
      return;
    }
    const indexLoaded = [], indexWords = [];
    (await Promise.allSettled(
      file.map((f) => this.#fetchJSON(`data/${f.id}.json`))
    )).map((json, idx) => {
      if (json.value) {
        indexLoaded.push({ id: file[idx].id, loaded: true });
        indexWords.push(
          ...Object.getOwnPropertyNames(json.value).map((w) => ({ word: w, page: json.value[w] }))
        );
      }
    });
    console.log("[loadIndex] write to DB");
    await Promise.allSettled([
      this.#db.put({ store: "file", item: indexLoaded }),
      this.#db.put({ store: "index", item: indexWords })
    ]);
    console.log("[loadIndex] COMPLETE");
  }
  // fetch data
  async #fetchJSON(datafile) {
    const uri = _StaticSearch.path + datafile;
    console.log(`Fetch JSON: ${uri}`);
    try {
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), this.fetchTimeout), res = await fetch(uri, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Fetch failed ${uri}: ${res.status}`);
      const json = await res.json();
      return json;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  }
};
var staticsearch = new StaticSearch();
await staticsearch.init();
console.log("-------------------");
console.log(await staticsearch.search("Hello. This is a search for Craig Buckler - a web developer."));
console.log(await staticsearch.search("seo"));
export {
  staticsearch
};
