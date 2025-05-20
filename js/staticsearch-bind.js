// staticsearch input/output binding
import { staticsearch } from './__SSDIR__/staticsearch.js';

let queryString = 'q';
const inputDebounce = 600;


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
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => startSearch(e.target.value), inputDebounce);
  }, false);

  // do search
  function startSearch( search ) {

    if (search.length < 3) return;

    staticsearch.find( search )
      .then( result => {
        console.log('SEARCH:', search);
        console.log('RESULT:', result);
        field.dispatchEvent(new CustomEvent(
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
      <p class="searchmessage"><span class="searchcount">0</span> found for "<em class="searchterm">term</em>"&hellip;</p>
    `;
  }

  // create default item template
  if (!itemTemplate) {
    itemTemplate = document.createElement('template');
    itemTemplate.innerHTML = `
      <li class="searchitem"><a class="url">
        <h2 class="title"></h2>
        <p class="description"></p>
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
    const
      template = messageTemplate.content.cloneNode(true),
      searchCount = template.querySelector('.searchcount'),
      searchTerm = template.querySelector('.searchterm');

    if (searchCount) searchCount.textContent = res.length;
    if (searchTerm) searchTerm.textContent = search;

    element.appendChild(template);

    // generate results list
    const list = document.createElement('ol');
    list.classList.add('searchlist');

    // and items
    res.forEach( (item, idx) => {

      if (maxResults && idx >= maxResults) return;

      const
        template = itemTemplate.content.cloneNode(true),
        url = template.querySelector('.url'),
        title = template.querySelector('.title'),
        description = template.querySelector('.description');

      if (url) {
        url.href = item.url;
        url.id = `staticsearchresult-${ item.id }`;
      }

      if (title) {
        title.textContent = item.title;
      }

      if (description) {
        description.textContent = item.description;
      }

      list.appendChild(template);

    });

    element.appendChild(list);
    element.scrollTop = 0;

  }, false);

}
