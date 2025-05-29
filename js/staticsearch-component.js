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

    // move click element to shadow DOM
    const searchLink = this.firstElementChild;
    searchLink.setAttribute('part', 'startsearch');

    // open shadow DOM
    this.attachShadow({ mode: 'open' });

    // load styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${StaticSearchWebComponent.path}css/component.css`;
    this.shadowRoot.appendChild(link);

    // append link
    const opener = this.shadowRoot.appendChild(searchLink);

    // create dialog
    this.#createDialog();

    // search click
    opener.style.cursor = 'pointer';
    opener.addEventListener('click', e => { e.preventDefault(); this.#toggleDialog(); });

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
    }

  }

  // show/hide search dialog
  #toggleDialog() {

    if (this.#dialog.open) {
      this.#closeDialog();
    }
    else {
      this.#dialog.showModal();
      this.setAttribute('aria-expanded', 'true');
      this.#search.focus();
    }

  }

  // close dialog
  #closeDialog() {
    this.#dialog.close();
    this.removeAttribute('aria-expanded');
    staticSearchSetQuery();
  }

  // create search dialog
  #createDialog() {

    const dialog = document.createElement('dialog');
    dialog.setAttribute('closedby', 'any');
    dialog.setAttribute('part', 'dialog');

    dialog.innerHTML = `
      <form method="dialog"><button part="close"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path xmlns="http://www.w3.org/2000/svg" fill="currentColor" d="M5.3 5.3a1 1 0 0 1 1.4 0l5.3 5.3 5.3-5.3a1 1 0 1 1 1.4 1.4L13.4 12l5.3 5.3a1 1 0 0 1-1.4 1.4L12 13.4l-5.3 5.3a1 1 0 0 1-1.4-1.4l5.3-5.3-5.3-5.3a1 1 0 0 1 0-1.4Z"/></svg></button></form>
      <search part="search">
        <label for="search" part="searchlabel">${ this.getAttribute('label') || 'search' }</label>
        <input type="search" id="search" name="q" minlength="2" maxlength="300" part="searchinput" />
      </search>
      <div part="results"></div>
    `;

    // get elements
    this.#dialog = this.shadowRoot.appendChild(dialog);
    this.#search = this.shadowRoot.querySelector('#search');
    this.#results = this.shadowRoot.querySelector('[part="results"]');

    // bind search result
    staticSearchResult(
      this.#results,
      this.getAttribute('minscore'),
      this.getAttribute('maxresults')
    );

    // bind search input
    staticSearchInput( this.#search );

    // dialog close event
    this.#dialog.addEventListener('close', () => this.#closeDialog());

    // close by clicking backdrop
    this.#dialog.addEventListener('click', e => {
      if (this.#dialog.open && e.target === this.#dialog) {
        this.#closeDialog();
      }
    });

  }

}

// register component
customElements.define('static-search', StaticSearchWebComponent);
