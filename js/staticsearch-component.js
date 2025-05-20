/*
staticsearch Web Component

Example:
  <static-search label="search" maxresults="0">
    <p>search</p>
  </static-search>
*/
import { staticSearchQuery, staticSearchSetQuery, staticSearchInput, staticSearchResult } from './__SSDIR__/staticsearch-bind.js';

class StaticSearchWebComponent extends HTMLElement {

  static path = (new URL( import.meta.url )).pathname.replace('__FILENAME__', '');

  #dialog = null;
  #search = null;
  #results = null;

  // initialize
  constructor() {
    super();
  }

  // component connected
  connectedCallback() {

    // load styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${StaticSearchWebComponent.path}css/component.css`;
    this.appendChild(link);

    // create dialog
    this.#createDialog();

    // search clicked
    this.firstElementChild.addEventListener('click', this);

    // Ctrl+K click
    window.addEventListener('keydown', e => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.#toggleDialog();
      }
    });

    // query string set?
    if (staticSearchQuery()) {

      this.#toggleDialog();

      // scroll result into view
      if (location.hash) {
        const link = document.getElementById( location.hash.slice(1) );
        if (link) {
          link.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

    }

  }

  // generic event handler
  handleEvent(e) {
    this.#toggleDialog();
  }

  // show/hide search dialog
  #toggleDialog() {

    if (this.#dialog.open) {
      // close dialog
      this.#dialog.close();
    }
    else {
      // show dialog
      this.#dialog.showModal();
      this.#search.focus();
    }

  }

  // create search dialog
  #createDialog() {

    const dialog = document.createElement('dialog');

    dialog.innerHTML = `
      <form method="dialog"><button class="close"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path xmlns="http://www.w3.org/2000/svg" fill="currentColor" d="M5.3 5.3a1 1 0 0 1 1.4 0l5.3 5.3 5.3-5.3a1 1 0 1 1 1.4 1.4L13.4 12l5.3 5.3a1 1 0 0 1-1.4 1.4L12 13.4l-5.3 5.3a1 1 0 0 1-1.4-1.4l5.3-5.3-5.3-5.3a1 1 0 0 1 0-1.4Z"/></svg></button></form>
      <search>
        <label for="search">${ this.getAttribute('label') || 'search' }</label>
        <input type="search" id="search" name="q" minlength="2" maxlength="300" />
      </search>
      <div id="search-results"></div>
    `;

    // get elements
    this.#dialog = this.appendChild(dialog);
    this.#search = this.querySelector('#search');
    this.#results = this.querySelector('#search-results');

    // bind search result
    staticSearchResult( this.#results, parseFloat( this.getAttribute('maxresults') || 0) );

    // bind search input
    staticSearchInput( this.#search );

    // dialog close event
    this.#dialog.addEventListener('close', () => {
      staticSearchSetQuery();
    });

    // close by clicking backdrop
    this.#dialog.addEventListener('click', e => {
      if (this.#dialog.open && e.target === this.#dialog) {
        this.#dialog.close();
      }
    });

  }

}

// register component
customElements.define('static-search', StaticSearchWebComponent);
