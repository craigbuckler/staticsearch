# StaticSearch

StaticSearch is a simple search engine you can add to any static website. It uses client-side JavaScript and JSON data files so there's no need for back-end server technologies or databases.

StaticSearch works with [Publican](https://publican.dev/) but can be used on any static site built by any generator. It currently works best on English language sites, but most Western languages can be used.

**[Full documentation is available at publican.dev/staticsearch](https://publican.dev/staticsearch/)**

[View the CHANGELOG for updates](https://github.com/craigbuckler/staticsearch/blob/main/CHANGELOG.md)

To use StaticSearch, build your static site to a directory, then:

1. [Index the pages](#index-your-site) to create JavaScript and JSON data files (do this every time your site changes).

1. [Add search functionality to your site](#add-search-functionality-to-your-site) following the first index.


## Index your site

Assuming your static site is generated in a sub-directory named `./build/`, run the StaticSearch CLI command:

```bash
npx staticsearch
```

It creates a new directory named `./build/search/` containing JavaScript code and word index data.

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

StaticSearch provides a [web component](https://publican.dev/tools/staticsearch/search-web-component/) to quickly add search facilities to your site. Add the following snippet to any template, perhaps in the HTML `<header>`:

```html
<script type="module" src="/search/staticsearch-component.js"></script>

<static-search title="press Ctrl+K to search">
  <p>search</p>
</static-search>
```

Any HTML element can be placed inside `<static-search>` to activate search when it's clicked. You can now rebuild the site to include this update and [re-run the indexer](#index-your-site).

For full help, refer to:

* [StaticSearch web component](https://publican.dev/tools/staticsearch/search-web-component/): provides full search functionality

* [StaticSearch bind module](https://publican.dev/tools/staticsearch/search-bind-module/): attach search functionality to HTML `<input>` and result elements

* [StaticSearch JavaScript search API](https://publican.dev/tools/staticsearch/search-api/): implement custom search functionality
