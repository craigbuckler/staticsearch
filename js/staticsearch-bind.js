// staticsearch input/output binding
import { staticsearch } from './__SSDIR__/staticsearch.js';

let queryString = 'q', queryCount = 0;
const
  appName = '__AGENT__',
  attached = Symbol(appName),
  inputDebounce = 500,
  format = {
    date: new Intl.DateTimeFormat([], { dateStyle: 'long' }).format,
    number: new Intl.NumberFormat([], { maximumFractionDigits: 0 }).format
  };

// detect bindable elements
(() => {

  const
    searchInput = document.getElementById('staticsearch_search'),
    searchResult = document.getElementById('staticsearch_result');

  if (searchResult) {

    // bind result
    staticSearchResult(
      searchResult,
      {
        minFound: searchResult.getAttribute('minfound'),
        minScore: searchResult.getAttribute('minscore'),
        maxResults: searchResult.getAttribute('maxresults')
      }
    );

  }

  if (searchInput && searchInput.tagName === 'INPUT') {

    // bind input
    staticSearchInput( searchInput );

  }

})();



// search set on querystring
export function staticSearchQuery() {

  const urlParams = new URLSearchParams(location.search);
  return urlParams.get(queryString) || '';

}


// set query string
export function staticSearchSetQuery( search, hash ) {

  const url = new URL(location);

  if (search) {
    url.searchParams.set(queryString, search);
  }
  else {
    url.searchParams.delete(queryString);
  }

  url.hash = hash || '';

  history.replaceState({}, '', url.href);

};


// bind a search field to staticsearch
export function staticSearchInput( field ) {

  // already attached?
  if (field[attached]) return;
  field[attached] = true;

  // querystring
  if (field.name) queryString = field.name;

  // query string or previous search set?
  const qs = staticSearchQuery() || sessionStorage.getItem(appName) || '';
  if (qs) field.value = qs;

  // field value set
  const v = field.value;
  if (v) startSearch(v);

  // debounced input
  let debounceTimer;
  field.addEventListener('input', e => {
    const search = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => startSearch(search), inputDebounce);
  }, false);

  // do search
  function startSearch( search ) {

    sessionStorage.setItem(appName, search);
    if (search.length < 2) return;

    staticsearch.find( search )
      .then( result => {
        console.log('SEARCH:', search);
        console.log('RESULT:', result);
      });
  }

}


// bind staticsearch result to an output element
export function staticSearchResult( element, opt = {} ) {

  // already attached?
  if (element[attached]) return;
  element[attached] = true;

  // search value
  let search = '';

  const
    minFound = parseFloat(opt.minFound) || 0,
    minScore = parseFloat(opt.minScore) || 0,
    maxResults = parseFloat(opt.maxResults) || 0,
    resultElement = opt.resultElement || 'ol';

  // create default message template
  let messageTemplate = opt.messageTemplate || document.getElementById('staticsearch_resultmessage');

  if (!messageTemplate) {
    messageTemplate = document.createElement('template');
    messageTemplate.innerHTML = '<p part="resultmessage"><span part="resultcount">0</span> found for <span part="searchterm"></span>&hellip;</p>';
  }

  // create default item template
  let itemTemplate = opt.itemTemplate || document.getElementById('staticsearch_item');

  if (!itemTemplate) {
    itemTemplate = document.createElement('template');
    itemTemplate.innerHTML = '<li part="item"><a part="link"><h2 part="title"></h2><p part="meta"><time part="date"></time> &ndash; <span part="words">0</span> words</p><p part="description"></p></a></li>';
  }


  // result clicked - update query string
  element.addEventListener('click', e => {

    const link = e.target.closest('a');
    if (link && search) {
      staticSearchSetQuery( search, link.id );
    }

  });


  // result event
  document.addEventListener('staticsearch:result', e => {

    // results
    search = e.detail.search;
    const res = e.detail.result;

    // clear results
    element.innerHTML = '';

    // generate results list
    const list = document.createElement( resultElement );
    list.setAttribute('part', 'searchresult');

    // and items
    res.forEach( (item, idx) => {

      if (item.found < minFound || (minScore && item.relevancy < minScore) || (maxResults && idx >= maxResults)) return;

      const template = itemTemplate.content.cloneNode(true);
      updateNode(template, 'link', null, { href: item.url, id: `staticsearchresult-${ item.id }` });
      updateNode(template, 'title', item.title);
      updateNode(template, 'description', item.description);
      if (item.date) updateNode(template, 'date', format.date( new Date(item.date) ), { datetime: item.date });
      if (item.words) updateNode(template, 'words', format.number( item.words ));

      list.appendChild(template);

    });

    // generate results message
    const msg = messageTemplate.content.cloneNode(true);
    updateNode(msg, 'resultcount', list.childElementCount);
    updateNode(msg, 'searchterm', search);

    element.appendChild(msg);
    element.appendChild(list);

    // scroll to linked item on first load
    if (!queryCount && location.hash) {

      const link = element.querySelector( location.hash );

      if (link) {
        link.focus();
        link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

    }
    else {
      element.scrollTop = 0;
    }

    queryCount++;

  }, false);


  // update node parts
  function updateNode(dom, part, text, attr = {}) {
    dom
      .querySelectorAll(`[part="${ part }"]`)
      .forEach( n => {

        for (const [prop, value] of Object.entries(attr)) {
          n.setAttribute(prop, value);
        }

        if (text) {
          while (n.firstElementChild) n = n.firstElementChild;
          n.textContent = text;
        }

      });
  }

}
