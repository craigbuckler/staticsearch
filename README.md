# StaticSearch

StaticSearch is a fast, modern client-side search engine you can add to any static site -- *[try it at StaticSearch.com](https://staticsearch.com/)*.

You can add search to your site in five minutes:

1. [Index your HTML pages](#index-your-site) to create the StaticSearch JavaScript and JSON data files. *(Repeat this step every time your content changes.)*

1. [Add search functionality to your pages](#add-search-functionality-to-your-site).

1. Test and deploy to production.


## StaticSearch benefits

* **zero backend and serverless**: no database, no maintenance, no security problems, no hassle.

* **fast zero configuration indexing**: StaticSearch understands your HTML pages. It indexes sites in seconds without you having to mark or programmatically add content.

* **fast fuzzy search**: users get instant results even on sites with thousands of pages.

* **minimal payload**: requires no more than 12Kb of CSS/JavaScript, incrementally loads and caches index data on demand, and offers superior performance even on phones and slower devices.

* **multi-lingual**: handles stemming, stop-word filtering, and character normalization in 27 languages -- *or you can add your own*.

* **framework agnostic**: StaticSearch works with all HTML Static Site Generators and client-side JavaScript libraries.

* **minimal developer overhead**: integrates into any build process with a single command.

* **custom search configuration**: optionally change search criteria, HTML templates, CSS styles, and JavaScript functionality.

* **standards compliant**: adheres with strict Content Security Policies, `robots.txt`,  `robots` meta tags, JSON data, JavaScript modules, and Web Components. Progressive enhancement permits [search functionality even when JavaScript fails](https://staticsearch.com/search-web-component/#search-activation-element).

* **open source**: use, inspect, extend, alter, and [sponsor the project](https://github.com/sponsors/craigbuckler).


## Documentation

* **[Full documentation at StaticSearch.com](https://staticsearch.com/)**

* [View the CHANGELOG for updates](https://github.com/craigbuckler/staticsearch/blob/main/CHANGELOG.md)

* [StaticSearch Github repository](https://github.com/craigbuckler/staticsearch/)

* [StaticSearch on npm](https://www.npmjs.com/package/staticsearch)

Please [sponsor StaticSearch development](https://github.com/sponsors/craigbuckler) if you find it useful.


## Index your site

The StaticSearch indexer requires [Node.js 22](https://nodejs.org/) or above and works on Windows, Linux, or macOS. You do not need to install StaticSearch but can add it globally or to any Node.js project.

From the command line, `cd` to the root of your website directory and enter:

```bash
npx staticsearch ./
```

StaticSearch creates a new sub-directory named `search` with the client-side index data and code that you can [add to pages](#add-search-functionality-to-your-site).


### Indexer help

You can [configure the indexer](https://staticsearch.com/search-indexer/) to change file and word processing options.

View the CLI options:

```bash
npx staticsearch --help
```

View environment variable options:

```bash
npx staticsearch --helpenv
```

View Node.js API options:

```bash
npx staticsearch --helpapi
```


## Add search functionality to your site

Add the following tag to your pages or templates where you want a search icon to appear (typically, in your page `<header>`):

```html
<script type="module" src="/search/staticsearch-here.js"></script>
```

You can style the SVG icon with CSS, e.g.

```css
static-search::part(activate) {
  inline-size: 2em;
  block-size: auto;
}
```

Rebuild the site if you're using a Static Site Generator such as [Publican](https://publican.dev/). Deploy or test the site locally using a tool such as [LiveLocalhost](https://publican.dev/tools/livelocalhost/).


### Advanced search configuration

StaticSearch provides four ways to add search to your site:

1. [StaticSearch script](https://staticsearch.com/staticsearch-here/)

   The simplest option adds search functionality with a single `<script>` as [shown above](#add-search-functionality-to-your-site).

1. [StaticSearch Web Component](https://staticsearch.com/search-web-component/)

   A fully-configurable Web Component that offers search options, custom templates, and styling.

1. [StaticSearch bind module](https://staticsearch.com/search-bind-module/)

   Attach custom search functionality to any HTML `<input>` and result elements.

1. [StaticSearch JavaScript search API](https://staticsearch.com/search-api/)

   Create your own custom search functionality using the client-side API.
