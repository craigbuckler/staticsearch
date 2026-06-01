# StaticSearch

StaticSearch is a simple search engine you can add to any static website. It uses client-side JavaScript and JSON data files so there's no need for back-end server technologies or databases.

StaticSearch works with [Publican](https://publican.dev/) sites but you can use it with any static site generator that outputs HTML pages. It works best on English sites, but supports most Latin-based languages.

**[Full documentation is available at staticsearch.com](https://staticsearch.com/)**

[View the CHANGELOG for updates](https://github.com/craigbuckler/staticsearch/blob/main/CHANGELOG.md)

To use StaticSearch, build your static site to a directory, then:

1. [Index the pages](#index-your-site) to create JavaScript and JSON data files (do this every time your site changes).

1. [Add search functionality to your site](#add-search-functionality-to-your-site) following the first index.


## Index your site

Assuming you've generated your static site to a sub-directory named `./build/`, run the StaticSearch CLI command:

```bash
npx staticsearch
```

StaticSearch creates a new directory named `./build/search/` containing JavaScript code and word index data.

If your site is in a different directory, such as `./dist/`, use:

```bash
npx staticsearch --builddir ./dist/
```

For help, refer to [StaticSearch indexer](https://publican.dev/tools/staticsearch/search-indexer/) or view CLI configuration help:

```bash
npx staticsearch --help
```

environment variable configuration help:

```bash
npx staticsearch --helpenv
```

or Node.js API configuration help:

```bash
npx staticsearch --helpapi
```


## Add search functionality to your site

StaticSearch provides four ways to add a search facility on your site. The easiest is a single `<script>` tag placed inside your pages perhaps in the HTML `<header>`:

```html
<script type="module" src="/search/staticsearch-here.js"></script>
```

This displays a icon in the script's location on the page that opens a search dialog when clicked.

If necessary, you can now rebuild your site to include this update and [re-run the indexer](#index-your-site) to ensure word indexes are up-to-date.

For full help, refer to:

* [StaticSearch script](https://staticsearch.com/staticsearch-here/): adds search functionality with a single `<script>`

* [StaticSearch web component](https://staticsearch.com/search-web-component/): provides full search functionality

* [StaticSearch bind module](https://staticsearch.com/search-bind-module/): attach search functionality to custom HTML `<input>` and result elements

* [StaticSearch JavaScript search API](https://staticsearch.com/search-api/): create your own custom search functionality.
