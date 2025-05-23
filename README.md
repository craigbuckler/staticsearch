# StaticSearch

A simple on-site search engine for static generated sites where no server-side functionality is available. It currently works best on English language sites, but most Western languages can be used.

*This is a functional beta project. Full documentation is coming soon.*


## Why does StaticSearch exist?

There are several JavaScript-only static search options, but many require you to programmatically add content in specific formats. [Pagefind](https://pagefind.app/) provides WASM-based indexing, but there are issues using stricter Content Security Policies and fairly heavy JavaScript.

StaticSearch offers a simpler indexing process with minimal code. For a typical 100-page site, it requires 80Kb of data and JavaScript before gzipping. 50Kb of that is loaded incrementally as you search. Downloaded data is cached in [IndexedDB](https://github.com/craigbuckler/pixdb) so search results become faster the more it's used.


## How does it work?

StaticSearch provides a configurable indexing process which extracts keywords from your built HTML files. It adds a new directory to your static site containing:

* a JSON index of pages and other meta data
* up to 676 small JSON keyword files with page relevancy scores
* JavaScript modules and options to implement search on your site.

StaticSearch is vanilla JavaScript and works with or without any framework.

Three JavaScript options are available:


### Easiest option: web component

A `<static-search>` Web Component provides full search functionality in any web page. You can define your own HTML `<templates>` and style it using CSS and custom properties.

The component uses the [bind module](#easy-option-bind-module) so it provides the same functionality.


### Easy option: bind module

This JavaScript module can automatically or programmatically bind HTML `<input>` and result elements to the StaticSearch process. You can define your own HTML `<templates>` and style as you like.

The bind module automatically handles:

* input deboucing
* result output
* URL querystring and hash functionality


### Hardest option: StaticSearch API

You can use the `staticsearch.find('<search string>');` functionality to return an ordered array of results and implement whatever input and output functionality you require.
