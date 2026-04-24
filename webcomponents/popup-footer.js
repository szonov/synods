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

          svg-icon {
            display: flex;
          }
        }

        </style>
        <div>
          <svg-icon name="down" size="14"></svg-icon>
          <span data-value="speedDownload"> –.– B/s</span>
          <span class="spacer"></span>
          <svg-icon name="up" size="14"></svg-icon>
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

    set(speedDownload, speedUpload, updatedAt) {
      this.setSpeedDownload(speedDownload)
      this.setSpeedUpload(speedUpload)
      this.setUpdatedAt(updatedAt)

      return this
    }

    hide() {
      this.shadowRoot.querySelector('div').style.display = 'none';
      return this;
    }
    show() {
      this.shadowRoot.querySelector('div').style.display = 'flex';
      return this;
    }
  }

  customElements.define('popup-footer', PopupFooter);
})();
