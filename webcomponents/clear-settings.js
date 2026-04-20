customElements.get("clear-settings") || customElements.define("clear-settings", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
      div {
        cursor: pointer;
        text-decoration: underline;
        color: #C43B38;
        &.disabled {
          color: #888;
          text-decoration: none;
          cursor: default;
        }
      }
      </style>
      <div>
          ${chrome.i18n.getMessage("clearSettings")}
      </div>
    `;
  }

  connectedCallback() {
    this.shadowRoot.querySelector("div").addEventListener("click", this.submit.bind(this));
  }

  _disable(disabled) {
    this.shadowRoot.querySelector("div").className = disabled ? "disabled" : "";
  }
  disable() {
    this._disable(true)
  }
  enable() {
    this._disable(false)
  }

  submit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (this.shadowRoot.querySelector("div").className === "disabled") {
      return;
    }
    if (!confirm(chrome.i18n.getMessage("clearSettingsConfirm"))) {
      return;
    }
    this.dispatchEvent(new CustomEvent('submit'))
  }
});
