(function () {

  const MESSAGES = {
    loading: chrome.i18n.getMessage('loading'),
    missingConfig: chrome.i18n.getMessage('missingConfig'),
    noActiveTasks: chrome.i18n.getMessage('noActiveTasks'),
  }

  class StateMessage extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.shadowRoot.innerHTML = `
        <style>
        div {
          text-align: center;
          color: #5f6368;
          padding: 20px;
        }
        </style>
        <div>${MESSAGES['loading']}</div>
      `;
    }

    set(text, isVisible = true) {
      const $div = this.shadowRoot.querySelector('div')
      $div.textContent = text
      $div.style.display = isVisible ? 'block' : 'none';
    }

    loading() {
      this.set(MESSAGES['loading'], true)
    }

    missingConfig() {
      this.set(MESSAGES['missingConfig'], true)
    }
    noActiveTasks() {
      this.set(MESSAGES['noActiveTasks'], true)
    }
    hide() {
      this.set('', false)
    }
  }

  customElements.define('state-message', StateMessage);
})();
