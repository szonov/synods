customElements.define("clear-settings", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
      div {
        max-width: 500px;
        margin: 18px auto;
        text-align: center;
      }
      span {
        cursor: pointer;
        text-decoration: underline;
        color: #C43B38;
        display: inline-block;
        &.disabled {
          color: #888;
          text-decoration: none;
          cursor: default;
        }
      }
      </style>
      <div>
        <span data-i18n="clearSettings">Clear Settings</span>
      </div>
    `;

    Utils.applyI18n(this.shadowRoot)
  }

  connectedCallback() {
    this.shadowRoot.querySelector("span").addEventListener("click", this.submit.bind(this));
  }

  _disable(disabled) {
    this.shadowRoot.querySelector("span").className = disabled ? "disabled" : "";
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
    if (this.shadowRoot.querySelector("span").className === "disabled") {
      return;
    }
    if (!confirm(chrome.i18n.getMessage("clearSettingsConfirm"))) {
      return;
    }
    this.dispatchEvent(new CustomEvent('submit'))
  }
});
