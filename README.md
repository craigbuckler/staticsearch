# StaticSearch

StaticSearch is a simple search engine you can implement on a static website.

An indexer scans your site's built files to generates a directory of JavaScript and JSON data. A search facility is then available on that site without the need for server-side processing or a database.

It currently works best on English language sites, but most Western languages can be used.

*This is a functional beta project. Use it at your own risk.*


## Quickstart

Assuming your static site has been generated in a sub-directory named `./build/`, run StaticSearch using:

```bash
npx staticsearch
```

It will create a new directory named `./build/search/` containing JavaScript code and word index data.

If your site is in a different directory, such as `./dist/`, use:

```bash
npx staticsearch --builddir ./dist/ --searchdir ./dist/search/
```

A web component is provided so you can easily add a search facility to your web page HTML, e.g.

```html
<script type="module" src="/search/staticsearch-component.js"></script>

<static-search title="press Ctrl+K to search">
  <a href="https://duckduckgo.com/?q=search%20site:mysite.com">search</a>
</static-search>
```

Any HTML element can be placed inside `<static-search>` to activate the search when it's clicked. In this example, a link has been provided to a search engine when JavaScript fails or is not available.


## Why use StaticSearch?

Several JavaScript-only static search options are available, but:

* most require you to programmatically add content in specific formats
* [Pagefind](https://pagefind.app/) provides more advanced WASM-based indexing, but it has a fairly heavy JavaScript payload and there are issues using strict [Content Security Policies](https://developer.mozilla.org/docs/Web/HTTP/Guides/CSP).

StaticSearch offers a simpler indexing process and generates minimal code.

* 13Kb of JavaScript and 4Kb of CSS is provided for the [web component](#web-component). Sites just using the [bind module](#bind-module) require 8Kb of JavaScript. Sites directly using the [API](#staticsearch-api) require 6Kb of JavaScript.

* A typical 100 page site is indexed in less than one second and generates 100Kb of word data.

* A typical 1,000 page site is indexed in less than six seconds and generates 800Kb of word data.

Index data is incrementally loaded on demand as you search for different words. Indexes are cached in [IndexedDB](https://www.npmjs.com/package/pixdb) so results appear faster the more searches you do.

StaticSearch weights words according to their location in headings, content, links etc. To keep it lightweight, it does not store full text indexes or other factors, but the results work well on smaller sites.


## How does StaticSearch work?

Run the StaticSearch indexing process whenever your site content changes. It would typically be done just before or as part of a deployment process.

During indexing, StaticSearch extracts words from all the HTML files in a build directory (`./build/`). By default, it:

* does not index any file matching a `Disallow: /some-directory/` line in `robots.txt` where it's defined below `User-agent: *` or `User-agent: staticsearch`.

* does not index any file with a `noindex` meta tag, e.g. `<meta name="robots" content="noindex">` or `<meta name="staticsearch" content="noindex">`.

* only examines words contained in the `<main>` HTML element.

* removes words contained in `<nav>` HTML elements (within `<main>`).

A new directory (`./build/search/`) is created that contains:

* a JSON index of pages and other meta data
* up to 676 small JSON keyword files with page relevancy scores
* vanilla JavaScript modules to implement search on your site with or without a JavaScript framework.


## StaticSearch configuration options

StaticSearch can be configured using CLI arguments, environment variables, or a Node.js API. The following parameters are available:

|CLI|ENV|API|description|
|-|-|-|-|
|`env`|||load defaults from an `.env` file|
|`builddir`|`BUILD_DIR`|`.buildDir`|directory containing static files (`./build/`)|
|`searchdir`|`SEARCH_DIR`|`.searchDir`|index file directory (`./build/search/`)|
|`domain`|`SITE_DOMAIN`|`.siteDomain`|site domain if links use full URL (`http://localhost`)|
|`root`|`BUILD_ROOT`|`.buildRoot`|site root path (`/`)|
|`indexfile`|`SITE_INDEXFILE`|`.siteIndexFile`|default index file (`index.html`)|
|`ignorerobotfile`|`SITE_PARSEROBOTSFILE`|`.siteParseRobotsFile`|parse robot.txt Disallows (`true`)|
|`ignorerobotmeta`|`SITE_PARSEROBOTSMETA`|`.siteParseRobotsMeta`|parse robot meta noindex (`true`)|
|`dom`|`PAGE_DOMSELECTORS`|`.pageDOMSelectors`|comma-separated content DOM nodes (`main`)|
|`domx`|`PAGE_DOMEXCLUDE`|`.pageDOMExclude`|comma-separated DOM nodes to exclude (`nav`)|
|`language`|`LANGUAGE`|`.language`|language (`en`)|
|`wordcrop`|`WORDCROP`|`.wordCrop`|crop word letters (`7`)|
|`stopwords`|`STOPWORDS`|`.stopWords`|comma-separated list of stop words|
|`weightlink`|`WEIGHT_LINK`|`.wordWeight.link`|word weight for inbound links (`5`)|
|`weighttitle`|`WEIGHT_TITLE`|`.wordWeight.title`|word weight for main title (`10`)|
|`weightdesc`|`WEIGHT_DESCRIPTION`|`.wordWeight.description`|word weight for description (`8`)|
|`weighth2`|`WEIGHT_H2`|`.wordWeight.h2`|word weight for H2 headings (`6`)|
|`weighth3`|`WEIGHT_H3`|`.wordWeight.h3`|word weight for H3 headings (`5`)|
|`weighth4`|`WEIGHT_H4`|`.wordWeight.h4`|word weight for H4 headings (`4`)|
|`weighth5`|`WEIGHT_H5`|`.wordWeight.h5`|word weight for H5 headings (`3`)|
|`weighth6`|`WEIGHT_H6`|`.wordWeight.h6`|word weight for H6 headings (`2`)|
|`weightemphasis`|`WEIGHT_EMPHASIS`|`.wordWeight.emphasis`|word weight for bold and italic (`2`)|
|`weightalt`|`WEIGHT_ALT`|`.wordWeight.alt`|word weight for alt tags (`1`)|
|`weightcontent`|`WEIGHT_CONTENT`|`.wordWeight.content`|word weight for content (`1`)|
|`version`|||show application version|
|`help`|||show help|
|`helpenv`|||show .env/environment variable help|
|`helpapi`|||show Node.js API help|


### File indexing options

The build directory (`builddir`|`BUILD_DIR`|`.buildDir`) is an absolute or relative path to the directory where static website files are built.

The search directory (`searchdir`|`SEARCH_DIR`|`.searchDir`) is an absolute or relative path to the directory where the search JavaScript and JSON data files are generated. This will normally be inside the build directory.

If your pages use links with fully qualified URLs, you should set a domain (`domain`|`SITE_DOMAIN`|`.siteDomain`) so they can be identified.

The web root path is presumed to be `/`, so the file named `./build/index.html` is your home page. You can set it to another path, such as `/blog/` if necessary (`root`|`BUILD_ROOT`|`.buildRoot`). The file at `./build/index.html` is then presumed to have the URL `http://site.com/blog/index.html` (or `http://site.com/blog/`).

The HTML index file used as the default for directory paths is presumed to be `index.html`. You can change this to another filename if necessary (`indexfile`|`SITE_INDEXFILE`|`.siteIndexFile`).

StaticSearch parses the `robots.txt` file in the root of the build directory and will not index any HTML file matching a `Disallow: /some-directory/` line below `User-agent: *` or `User-agent: staticsearch`. This can be disabled by setting `--ignorerobotfile`|`SITE_PARSEROBOTSFILE=false`|`.siteParseRobotsFile=false`.

StaticSearch parses HTML `meta` tags and will not index any HTML file where `content="noindex"` in `<meta name="robots">` or `<meta name="staticsearch">`. This can be disabled by setting `--ignorerobotmeta`|`SITE_PARSEROBOTSMETA=false`|`.siteParseRobotsMeta=false`.


### Page indexing options

The `dom`|`PAGE_DOMSELECTORS`|`.pageDOMSelectors` value defines a comma-delimited list of CSS DOM selectors to index on the page. The default is `main`, but you can set it to anything else, e.g. `article.primary,footer,.other`.

The `domx`|`PAGE_DOMEXCLUDE`|`.pageDOMExclude` value defines a comma-delimited list of CSS DOM selectors to **exclude** from the `dom`|`PAGE_DOMSELECTORS`|`.pageDOMSelectors`. The default is `nav`, but you can set it to anything else, e.g. `nav,aside,.private`.


### Word indexing options

The default `language`|`LANGUAGE`|`.language` is English (`en`). This provides stemming and stop word lists to reduce the size of the index and provide fuzzier searching. Setting any other language indexes every word without stemming or stop words.

By default, `wordcrop`|`WORDCROP`|`.wordCrop` is set to `7`: only the first 7 letters of any word are considered important. Therefore, the word "consider", "considered", and "considering" are effectively identical (and indexed as `conside`). You can change this limit if necessary.

You can add further stop words (words omitted from the index) using `stopwords`|`STOPWORDS`|`.stopWords`. For example, if your site is about "Acme widgets", it's probably mentioned on every page. The words are of little use in the search index so set the stop words `acme,widget`.

The `weight` values define the score allocated to a word on a page and can be configured to your preferences. If PageX contains the word "static" in the title, description meta tag, and an H2, it will score 10 + 8 + 6 = 24 for that word. Someone searching for "static" would see it above any page scoring 23 or lower.

In addition, every page linking to PageX using the word "static" will add a further 5 points to the score. Lots of inbound links therefore override mentions in titles and text. It's best to omit menus from indexing since they will link to most pages (`domx`|`PAGE_DOMEXCLUDE`|`.pageDOMExclude` is set to `nav`).


### CLI options

There is no need to install StaticSearch since you can use `npx`.

View CLI help:

```bash
npx staticsearch --help
```

To use the CLI, run:

```bash
npx staticsearch [options]
```

where [CLI `[options]` are listed above](#staticsearch-configuration-options). For example, index the `./dist/` directory, omitting `nav` and `.private` DOM nodes, with an inbound link weight of 20:

```bash
npx staticsearch --builddir ./dist/ --searchdir ./dist/search/ --domx nav,.private --weightlink 20
```

Note you can install StaticSearch globally if you intend using it on several sites:

```bash
npm install staticsearch -g
```

You can then run it without `npx`:

```bash
staticsearch [options]
```


### ENV options

You can set indexing options with environment variables (as [listed above](#staticsearch-configuration-options)).

View environment variable help:

```bash
npx staticsearch --helpenv
```

It may be easier to define variables in an .env file, e.g.

```env
# Example .env file
BUILD_DIR=./dest/
SEARCH_DIR=./dest/index/
PAGE_DOMEXCLUDE=nav,.private
WEIGHT_LINK=20
```

then load it using:

```bash
npx staticsearch --env .env
```

Note that CLI arguments take precedence over environment variables.


### API options

You can include StaticSearch within any Node.js project and configure it using JavaScript code to set properties (as [listed above](#staticsearch-configuration-options)). This may be practical if you want to make StaticSearch an integral part of your build process.

View Node.js API help:

```bash
npx staticsearch --helpapi
```

Install the module into a Node.js project:

```bash
npm install staticsearch
```

Add code to a Node.js file (such as index.js):

```js
// EXAMPLE CODE
import { staticsearch } from 'staticsearch';

// configuration
staticsearch.buildDir = './dest/';
staticsearch.searchDir = './dest/index/';
staticsearch.pageDOMExclude = 'nav,.private';
staticsearch.wordWeight.link = 20;

// run indexer
await staticsearch.index();
```

Then run it:

```bash
node index.js
```

When a value is not defined, StaticSearch falls back to an environment variable then the default value.


## How to add a search to your static site

StaticSearch provides three options for implementing search on your site. This can be achieved in HTML alone unless you want to implement your own JavaScript functionality.

The following examples assume the search index files have been generated in the static site's `/search/` directory.


### Web component

The `<static-search>` web component provides full search functionality in any web page:

```html
<!-- include script once on your page -->
<script type="module" src="/search/staticsearch-component.js"></script>

<!-- define web component -->
<static-search title="press Ctrl+K to search">
  <p>search</p>
</static-search>
```

A single inner element is required that can be clicked to activate the search. It opens a modal dialog with an input field and list of results.

The following attributes can be added to the `<static-search>` element:

* `title="<string>"` - activation instructions (clicking and Ctrl|Cmd + K is supported)
* `label="<string>"` - the label on the search `<input>`
* `minscore="<num>"` - only show pages with total relevancy scores of this or above on results
* `maxresults="<num>"` - show up to this number of pages on the results

The web component uses the [bind module](#bind-module) so it provides the same functionality.


#### Overriding HTML templates

A message is shown at the top of results with the following HTML:

```html
<p part="resultmessage">
  <span part="resultcount">0</span> found for
  <span part="searchterm"></span>&hellip;
</p>
```

You can override this using a `<template>` with an ID of `staticsearch_resultmessage` in your HTML page (it can be within `<static-search>` or anywhere else). It can set the `part` attributes `"resultmessage"`, `"resultcount"`, and `"searchterm"` as necessary, e.g.

```html
<template id="staticsearch_resultmessage">

  <p part="resultmessage">
    Static search found
    <span part="resultcount">0</span> results
    for <span part="searchterm"></span>.
  </p>

</template>
```

Search results are shown in an ordered list `<ol part="searchresult">`. The following HTML is used for each item:

```html
<li part="item">
  <a part="link">
    <h2 part="title"></h2>
    <p part="meta">
      <time part="date"></time> &ndash;
      <span part="words">0</span> words
    </p>
    <p part="description"></p>
  </a>
</li>
```

Note that the date and word count number are formatted for the user's locale.

You can override this using a `<template>` with an ID of `staticsearch_item` in your HTML page (it can be within `<static-search>` or anywhere else). Set the `part` attributes `"item"`, `"link"`, `"title"`, `meta`, `date`, `words`, and `"description"` as necessary, e.g. show the title but no meta values or description in an `<article>`:

```html
<template id="staticsearch_item">

  <li part="item">
    <article>
      <h2 part="title"><a part="link"></a></h2>
    </article>
  </li>

</template>
```


#### Overriding CSS styles

The following CSS custom properties (variables) can be set in the `:root` or any element containing `<static-search>`. The defaults are shown below. Light/dark themes will be followed presuming your CSS sets `color-scheme: light dark;`, `color-scheme: light;`, or `color-scheme: dark;` accordingly.

```css
:root {
  /* font size */
  --staticsearch-fontsize: 1em;

  /* modal dimensions */
  --staticsearch-maxwidth: 60ch;
  --staticsearch-margin: 3vmin;
  --staticsearch-padding: 2vmin;
  --staticsearch-fieldset-height: calc(3em + (2 * var(--staticsearch-padding)));

  /* colors */
  --staticsearch-color-back: Canvas;
  --staticsearch-color-border: ButtonFace;

  --staticsearch-color-fore0: CanvasText;
  --staticsearch-color-fore1: color-mix(in oklab, CanvasText 80%, Canvas);
  --staticsearch-color-fore2: color-mix(in oklab, CanvasText 60%, Canvas);

  --staticsearch-color-link: color-mix(in oklab, LinkText 70%, CanvasText);
  --staticsearch-color-visited: color-mix(in oklab, VisitedText 70%, CanvasText);

  --staticsearch-color-shadow: #000;
  --staticsearch-color-backdrop: color-mix(in srgb, var(--colshad0), transparent 30%);
  --staticsearch-backdrop-blur: 3px;
}
```

Alternatively, you can target `static-search` elements and [`part` selectors](#overriding-html-templates), e.g.

```css
static-search {

  /* modal dialog */
  &::part(dialog) {
    border: 5px solid #f00;
  }

  /* input */
  &::part(searchlabel) {
    text-transform: uppercase;
  }

  &::part(searchinput) {
    font-family: monospace;
  }

  /* results */
  &::part(results) {
    font-style: italic;
  }

  &::part(resultmessage) {
    font-size: 1.5em;
  }

  &::part(description) {
    font-size: 0.8em;
  }

}
```


### Bind module

The JavaScript bind module can automatically or programmatically attach StaticSearch functionality to an HTML `<input>` and a result element. It provides functionality to handle:

* input debouncing
* results output
* URL querystring and hash functionality when clicking a link and clicking back.

The module's used by the [web component](#web-component) so the processes are similar.

The following example automatically binds input and results elements without further code:


```html
<!-- include script once on your page -->
<script type="module" src="/search/staticsearch-bind.js"></script>

<!-- define input and result elements -->
<search>

  <input type="search" id="staticsearch_search">
  <div id="staticsearch_result"></div>

</search>
```

The `staticsearch_result` element can set optional attributes:

* `minscore="<num>"` - only show pages with total relevancy scores of this or above on results
* `maxresults="<num>"` - show up to this number of pages on the results

As [shown above](#overriding-html-templates), you can set your own HTML `<template>`s and style anything as you like:

```html
<search>

  <input type="search" id="staticsearch_search">
  <div id="staticsearch_result"></div>

  <!-- custom result message -->
  <template id="staticsearch_resultmessage">
    <p part="resultmessage">
      Static search found
      <span part="resultcount">0</span> results
      for <span part="searchterm"></span>.
    </p>
  </template>

  <!-- custom result output -->
  <template id="staticsearch_item">
    <li part="item">
      <article>
        <h2 part="title">
          <a part="link"></a>,
          <time part="date"></time>
        </h2>
      </article>
    </li>
  </template>

</search>
```

Alternatively, you can programmatically bind input and result elements. This may be useful if you're using a client-side framework to dynamically create content. Consider the HTML:

```html
<search>

  <input type="search" id="mysearch">
  <div id="myresult"></div>

</search>
```

you can bind the elements to StaticSearch in JavaScript:

```js
import { staticSearchInput, staticSearchResult } from '/search/staticsearch-bind.js';

staticSearchInput( document.getElementById('mysearch') );
staticSearchResult( document.getElementById('myresult') );
```

`staticSearchInput(element)` is passed the input element.

`staticSearchResult(element, options)` is passed the result element and an optional options object with the following properties:

* `.minScore` - only show pages with total word scores of this or above on results
* `.maxResults` - show up to this number of pages on the results
* `.resultElement` - the outer list element (defaults to `ol`)
* `.messageTemplate` - a DOM `<template>` configuring the results message
* `.itemTemplate` - a DOM `<template>` configuring a result item


### StaticSearch API

You can implement whatever input and output functionality or styling you require by directly using the StaticSearch JavaScript API. The `.find()` method returns an array of results for a specific search term:

```js
import { staticsearch } from '/search/staticsearch.js';

const result = await staticsearch.find('some search query');
/*
Returns an array of page objects sorted by relevancy. Example:
[
  {
    "id": 42,
    "url": "/news/search-engine-optimization/",
    "title": "Do Publican sites rank better?",
    "description": "Do static sites rank better in search engines?",
    "date": "2025-01-31",
    "words": 1234
    "relevancy": 21
  },
  {
    "id": 55,
    "url": "/docs/recipe/feeds/txt-sitemap/",
    "title": "Create a text sitemap",
    "description": "How to output a list of all pages for search engines.",
    "date": "2025-02-01",
    "words": 954
    "relevancy": 12
  },
  {
    "id": 22,
    "url": "/news/site-performance/",
    "title": "Are static sites fast?",
    "description": "Static sites typically perform better than others.",
    "date": "2025-02-22",
    "words": 222
    "relevancy": 2
  }
]
*/
```


### StaticSearch events

However a search is initiated, `staticsearch:` events are triggered on the `document` property:

```js
// search started
document.addEventListener('staticsearch:find', e => {

  // get search term
  const { search } = e.detail;

});

// search result available
document.addEventListener('staticsearch:result', e => {

  // get search term and result array
  const { search, result } = e.detail;

});
```
