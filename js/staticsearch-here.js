// auto-add <static-search> component at <script> location in DOM
import './__SSDIR__/staticsearch-component.js';

const ssHere = document.body.querySelector('script[src$="staticsearch-here.js"]');
if (ssHere) {

  const search = document.createElement('static-search');
  search.label = 'search';
  search.title = 'search Ctrl+K';
  search.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="1em" height="1em"><path d="M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm-8 6a8 8 0 1 1 14.3 5l5.4 5.3a1 1 0 0 1-1.4 1.4l-5.4-5.4A8 8 0 0 1 2 10Z"/></svg>';

  ssHere.after(search);

}
