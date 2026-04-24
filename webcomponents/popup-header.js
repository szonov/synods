(function () {

  class PopupHeader extends HTMLElement {
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
          border-bottom: 1px solid #e0e0e0;
          padding: 12px 12px 8px 12px;
          display: flex;

          h1 {
            flex-grow: 1;
            padding-left: 24px;
            font-size: 14px;
            font-weight: 600;
            background: no-repeat 0 1px url("../icons/icon16.png");
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          a {
            text-decoration: none;
            flex-grow: 0;
            color: #ccc;
            margin-left: 8px;

            &:hover {
              color: #1a73e8;
            }
          }
        }

        </style>
        <div>
          <h1 data-i18n="extName">Synology Download Manager</h1>

          <a href="#" data-action="dsm" data-i18n="title,openDsm">
            <svg-icon name="external-link" size="20"></svg-icon>
          </a>

          <a href="#" data-action="settings" data-i18n="title,openSettings">
            <svg-icon name="settings" size="20"></svg-icon>
          </a>
        </div>
      `;

      Utils.applyI18n(this.shadowRoot)
    }

    connectedCallback() {
      this.shadowRoot.querySelectorAll("[data-action]").forEach((elem) => {
        elem.addEventListener("click", async(e) => {
          e.preventDefault();

          switch(elem.dataset.action) {
            case "dsm":
              const host = await chrome.runtime.sendMessage({action: "get-host"});
              if (host) {
                await chrome.tabs.create({
                  url: `${host}/index.cgi?launchApp=SYNO.SDS.DownloadStation.Application`,
                  active: true,
                });
              } else {
                await chrome.runtime.openOptionsPage();
              }
              break
            case "settings":
              await chrome.runtime.openOptionsPage();
              break;
          }
        })
      })
    }

  }

  customElements.define('popup-header', PopupHeader);
})();
