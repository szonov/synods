(function () {

  class PopupFooter extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.shadowRoot.innerHTML = `
        <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        div {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          color: #666;
          border-top: 1px solid #e0e0e0;
          .spacer {
            margin-right: 8px;
          }

          .last-update-box {
            margin-left: auto;
            font-style: italic;
            font-size: 10px;
            color: #5f6368;
          }

          svg {
            width: 14px;
            height: 14px;
            margin: 0;
          }
        }

        </style>
        <div>
          <svg class="down" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M18 13l-6 6"/><path d="M6 13l6 6"/></svg>
          <span data-value="speedDownload"> –.– B/s</span>
          <span class="spacer"></span>
          <svg class="up" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M18 11l-6 -6"/><path d="M6 11l6 -6"/></svg>
          <span data-value="speedUpload"> –.– B/s</span>
          <span class="last-update-box">
            <span data-i18n="lastUpdate"></span>: <span data-value="updatedAt"> –– </span>
          </span>
        </div>
      `;
      Utils.applyI18n(this.shadowRoot)
    }
    setSpeedDownload(speed) {
      this.shadowRoot.querySelector(`[data-value="speedDownload"]`).textContent = Utils.humanSpeed(speed);
    }
    setSpeedUpload(speed) {
      this.shadowRoot.querySelector(`[data-value="speedUpload"]`).textContent = Utils.humanSpeed(speed);
    }
    setUpdatedAt(value) {
      this.shadowRoot.querySelector(`[data-value="updatedAt"]`).textContent = Number.isFinite(value)
      ? new Date(value * 1000).toLocaleTimeString()
      : "--";
    }

    hide() {
      this.shadowRoot.querySelector('div').style.display = 'none';
    }
    show() {
      this.shadowRoot.querySelector('div').style.display = 'flex';
    }
  }

  customElements.define('popup-footer', PopupFooter);
})();
