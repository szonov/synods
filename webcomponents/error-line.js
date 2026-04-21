(function () {

  class ErrorLine extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.shadowRoot.innerHTML = `
        <style>
        div {
          background: #c43b38;
          color: white;
          text-align: center;
          font-size: 11px;
          padding: 2px 0;
        }
        </style>
        <div style="display: none"></div>
      `;
    }

    show(text) {
      const $div = this.shadowRoot.querySelector('div')
      $div.textContent = text
      $div.style.display = (text) ? 'block' : 'none';
    }

    hide() {
      this.show('')
    }
  }

  customElements.define('error-line', ErrorLine);
})();
