// staticsearch input/output binding
import { staticsearch } from './__SSDIR__/staticsearch.js';

let queryString = 'q';
const inputDebounce = 500;


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
  if (qs) {
    field.value = qs;
    startSearch(qs);
  }

  // debounced input
  let debounceTimer;
  field.addEventListener('input', e => {
    const search = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => startSearch(search), inputDebounce);
  }, false);

  // do search
  function startSearch( search ) {

    if (search.length < 3) return;

    staticsearch.find( search )
      .then( result => {
        console.log('SEARCH:', search);
        console.log('RESULT:', result);
        document.dispatchEvent(new CustomEvent(
          'staticsearch:find',
          {
            bubbles: true,
            detail: { search, result }
          }
        ));
      });
  }

}


// bind staticsearch result to an output element
export function staticSearchResult( element, maxResults, messageTemplate, itemTemplate ) {

  // search value
  let search = '';

  // result clicked - update query string
  element.addEventListener('click', e => {

    const link = e.target.closest('a');
    if (link && search) {
      staticSearchSetQuery( search, link.id );
    }

  });

  // create default message template
  if (!messageTemplate) {
    messageTemplate = document.createElement('template');
    messageTemplate.innerHTML = `
      <p part="resultmessage"><span part="resultcount">0</span> found for <span part="searchterm"></span>&hellip;</p>
    `;
  }

  // create default item template
  if (!itemTemplate) {
    itemTemplate = document.createElement('template');
    itemTemplate.innerHTML = `
      <li part="item"><a part="link">
        <h2 part="title"></h2>
        <p part="description"></p>
      </a></li>
    `;
  }

  // result event
  document.addEventListener('staticsearch:find', e => {

    // results
    search = e.detail.search;
    const res = e.detail.result;

    // clear results
    element.innerHTML = '';

    // generate results message
    const msg = messageTemplate.content.cloneNode(true);
    updateNode(msg, 'resultcount', res.length);
    updateNode(msg, 'searchterm', search);

    // generate results list
    const list = document.createElement('ol');
    list.setAttribute('part', 'searchresult');

    // and items
    res.forEach( (item, idx) => {

      if (maxResults && idx >= maxResults) return;

      const template = itemTemplate.content.cloneNode(true);
      updateNode(template, 'link', null, { href: item.url, id: `staticsearchresult-${ item.id }` });
      updateNode(template, 'title', item.title);
      updateNode(template, 'description', item.description);

      list.appendChild(template);

    });

    element.appendChild(msg);
    element.appendChild(list);
    element.scrollTop = 0;

  }, false);


  // update node parts
  function updateNode(dom, part, text, attr = {}) {
    dom
      .querySelectorAll(`[part="${ part }"]`)
      .forEach( n => {
        if (text) n.textContent = text;
        for (const [prop, value] of Object.entries(attr)) {
          n.setAttribute(prop, value);
        }
      });
  }

}
