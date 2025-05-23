// staticsearch input/output binding
import { staticsearch } from './__SSDIR__/staticsearch.js';

let queryString = 'q', queryCount = 0;
const inputDebounce = 500;

// detect bindable elements
(() => {

  const
    searchInput = document.getElementById('staticsearch_search'),
    searchResult = document.getElementById('staticsearch_result');

  if (searchResult) {

    // bind result
    staticSearchResult(
      searchResult,
      searchResult.getAttribute('minscore'),
      searchResult.getAttribute('maxresults')
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

  // querystring
  if (field.name) queryString = field.name;

  // query string set?
  const qs = staticSearchQuery();
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

    if (search.length < 2) return;

    staticsearch.find( search )
      .then( result => {
        console.log('SEARCH:', search);
        console.log('RESULT:', result);
      });
  }

}


// bind staticsearch result to an output element
export function staticSearchResult( element, minScore, maxResults, resultElement, messageTemplate, itemTemplate ) {

  // search value
  let search = '';

  minScore = parseFloat(minScore) || 0;
  maxResults = parseFloat(maxResults) || 0;

  // create default message template
  messageTemplate = messageTemplate || document.getElementById('staticsearch_resultmessage');

  if (!messageTemplate) {
    messageTemplate = document.createElement('template');
    messageTemplate.innerHTML = '<p part="resultmessage"><span part="resultcount">0</span> found for <span part="searchterm"></span>&hellip;</p>';
  }

  // create default item template
  itemTemplate = itemTemplate || document.getElementById('staticsearch_item');

  if (!itemTemplate) {
    itemTemplate = document.createElement('template');
    itemTemplate.innerHTML = '<li part="item"><a part="link"><h2 part="title"></h2><p part="description"></p></a></li>';
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
    const list = document.createElement(resultElement || 'ol');
    list.setAttribute('part', 'searchresult');

    // and items
    res.forEach( (item, idx) => {

      if ((minScore && item.relevancy < minScore) || (maxResults && idx >= maxResults)) return;

      const template = itemTemplate.content.cloneNode(true);
      updateNode(template, 'link', null, { href: item.url, id: `staticsearchresult-${ item.id }` });
      updateNode(template, 'title', item.title);
      updateNode(template, 'description', item.description);

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
