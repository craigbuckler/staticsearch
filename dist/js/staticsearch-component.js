// js/staticsearch-component.js
import { staticsearch } from "./__SSDIR__/staticsearch.js";
var StaticSearchWebComponent = class _StaticSearchWebComponent extends HTMLElement {
  static path = new URL(import.meta.url).pathname.replace("__FILENAME__", "");
  #dialog = null;
  // initialize
  constructor() {
    super();
  }
  // component connected
  connectedCallback() {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${_StaticSearchWebComponent.path}css/component.css`;
    this.appendChild(link);
    this.firstElementChild.addEventListener("click", this);
  }
  handleEvent(e) {
    this.#showDialog();
  }
  #showDialog() {
    if (!this.#dialog) {
      const dialog = document.createElement("dialog");
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
    this.#dialog.showModal();
  }
};
customElements.define("static-search", StaticSearchWebComponent);
