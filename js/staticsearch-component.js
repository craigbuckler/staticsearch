import { staticsearch } from './__SSDIR__/staticsearch.js';

class StaticSearchWebComponent extends HTMLElement {

  static path = (new URL( import.meta.url )).pathname.replace('__FILENAME__', '');

  #dialog = null;

  // initialize
  constructor() {
    super();
  }

  // component connected
  connectedCallback() {

    // append styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${StaticSearchWebComponent.path}css/component.css`;
    this.appendChild(link);

    // search clicked
    this.firstElementChild.addEventListener('click', this);

  }

  handleEvent(e) {
    this.#showDialog();
  }

  #showDialog() {

    if (!this.#dialog) {

      const dialog = document.createElement('dialog');

      dialog.innerHTML = `
        <form method="dialog">
          <button id="close">Close</button>
        </form>

        <form>
          <label for="search">Search</label>
          <input type="search" id="search" />
        </form>

        <div id="results">
        </div>
      `;
      this.#dialog = this.appendChild(dialog);

    }

    // show dialog
    this.#dialog.showModal();

  }

}

// register component
customElements.define('static-search', StaticSearchWebComponent);
