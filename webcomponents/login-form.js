customElements.define("login-form", class extends HTMLElement {
  constructor() {
    super();
    this._defaultTimeout = 4000;
    this._statusTimer = 0;
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
      :host {
        display: block;
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      .container {
        max-width: 500px;
        margin: 0 auto;
        background: white;
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        h1 {
          font-size: 20px;
          padding: 16px 0 16px 52px;
          border-bottom: 1px solid #ddd;
          background: no-repeat 12px 12px url("../icons/icon32.png");
        }
        h2 {
          font-size: 16px;
          color: #5f6368;
          padding: 8px 16px;
        }
        form {
          padding: 0 16px 16px 16px;
        }
      }

      .form-group {
        padding: 8px 0;

        label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
        }

        input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
      }

      .action-group {
        padding: 8px 0 0 0;
        display: flex;
        align-items: center;

        button {
          background: #1a73e8;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-right: 12px;
          &:disabled {
            pointer-events: none;
            opacity: .65;
          }
        }
        span {
          &.success {
            color: #0d8050;
          }
          &.error {
            color: #C43B38;
          }
        }
      }
      </style>
      <div class="container">
        <h1 data-i18n="extName">Synology Download Manager</h1>
        <h2 data-i18n="openSettings">Settings</h2>
        <form>
          <div class="form-group">
            <label for="host" data-i18n="hostLabel">Synology Host</label>
            <input type="text" id="host" placeholder="https://your-synology:5001"/>
          </div>
          <div class="form-group">
            <label for="account" data-i18n="usernameLabel">Username</label>
            <input type="text" id="account"/>
          </div>
          <div class="form-group">
            <label for="passwd" data-i18n="passwordLabel">Password</label>
            <input type="password" id="passwd"/>
          </div>
          <div class="action-group">
            <button type="submit" data-i18n="saveBtn">Save</button>
            <span id="status"></span>
          </div>
        </form>
      </div>
      `;
      Utils.applyI18n(this.shadowRoot)
  }

  connectedCallback() {
    this.shadowRoot.querySelector("form").addEventListener("submit", this.submit.bind(this));
  }
  disconnectedCallback() {
    clearTimeout(this._statusTimer);
  }

  get values() {
    let data = {};
    this.shadowRoot.querySelectorAll("input").forEach(($el) => {
      data[$el.id] = $el.value;
    })
    return data;
  }

  set values(value) {
    this.shadowRoot.querySelectorAll("input").forEach(($el) => {
      $el.value = value[$el.id] ?? '';
    })
  }

  status(className, message, timeout = 0) {
    clearTimeout(this._statusTimer)
    const $status = this.shadowRoot.getElementById('status');
    $status.textContent = message;
    $status.className = className;
    timeout = timeout <= 0 ? this._defaultTimeout : timeout;
    this._statusTimer = setTimeout(() => {
      $status.textContent = '';
      $status.className = '';
    }, timeout);
    return this;
  }

  _validate({host, account, passwd}) {
    if (host === "" || account === "" || passwd === "") {
      this.status('error', chrome.i18n.getMessage("requiredAll"));
      return false;
    }

    if (!host.startsWith("http://") && !host.startsWith("https://")) {
      this.status('error', chrome.i18n.getMessage("invalidHost"));
      return false;
    }

    return true;
  }
  _disable(disabled) {
    this.shadowRoot.querySelectorAll("input, button").forEach(($el) => {
      $el.disabled = disabled;
    })
  }
  disable() {
    this._disable(true)
    return this;
  }
  enable() {
    this._disable(false)
    return this;
  }

  submit(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const values = this.values;
    if (this._validate(values)) {
      this.dispatchEvent(new CustomEvent('submit', {detail:this.values}))
    }
  }
});
