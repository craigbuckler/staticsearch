# Changelog

## [0.5.0 - 2025-08-05](#050---2025-08-05)

* new `found` value in search results with the proportion of words used in the page (0.0 to 1.0). A page including two of four search words has a `found` value of 0.5.
* new `minfound` attribute (or `minFound` property) to limit results to a specific `found` value. Setting `minfound="1"` means a results page must contain all search words (logical AND).
* stopword lists added for Danish (da), Dutch (nl), Finnish (fi), French (fr), German (de), Italian (it), Norwegian (no), Portuguese (pt), Spanish (es), Swedish (sv), and Turkish (tr), courtesy of [Stopwords ISO](https://github.com/stopwords-iso)


## [0.4.0 - 2025-06-25](#040---2025-06-25)

* improved content indexing when no HTML `<main>` element is found
* set a log verbosity level: `0` errors only, `1` errors, status, or `2` all
* when no `searchdir` is set, the default is a `search` sub-directory of the `builddir`
* fixed issue where a `noindex` meta tag could be found on minified HTML
* smaller README with a link to documentation at [publican.dev/staticsearch/](https://publican.dev/staticsearch/)
* [ConCol](https://www.npmjs.com/package/concol) update


## [0.3.0 - 2025-06-12](#030---2025-06-12)

* extracts information in [schema.org structured data](https://schema.org/) when possible
* indexes and displays page dates and word counts
* `staticSearchResult()` now accepts an options object parameter
* indexer removes words found in code elements
* slightly faster and more robust English stemming algorithm
* development terms removed from English stop words
* minor CSS tweaks


## [0.2.1 - 2025-06-06](#021---2025-06-06)

* fixed Windows issue with dynamically loaded stem function
* fixed issue checking JavaScript reserved words in `stem_en.js`
* log shows indexing has started
* minor help updates


## [0.2.0 - 2025-06-05](#020---2025-06-05)

* the previous search is remembered when navigating to other pages
* identical indexes now use the same `version` number (SHA1 hash rather than date)
* `staticSearchInput()` and `staticSearchResult()` will not bind the same element twice
* missing element in `<static-search>` no longer causes an error
* fixed CLI parsing of `--ignorerobotfile` and `--ignorerobotmeta`
* uses [PerfPro](https://www.npmjs.com/package/perfpro) for performance monitoring
* uses [ConCol](https://www.npmjs.com/package/concol) for prettier console logging
* added `document` event information to README.md


## [0.1.1 - 2025-05-31](#011---2025-05-31)

* fixed performance logging clashes


## [0.1.0 - 2025-05-30](#010---2025-05-30)

* initial working version
