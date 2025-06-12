# Changelog


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
