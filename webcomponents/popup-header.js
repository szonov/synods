(function () {

  const ICONS = {
    openDsm: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="2"/></svg>`,
  }

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

            svg {
              width: 20px;
              height: 20px;
            }

            &:hover {
              color: #1a73e8;
            }
          }
        }

        </style>
        <div>
          <h1>${chrome.i18n.getMessage('extName')}</h1>

          <a href="#" data-action="dsm" title="${chrome.i18n.getMessage('openDsm')}">
            ${ICONS['openDsm']}
          </a>

          <a href="#" data-action="settings" title="${chrome.i18n.getMessage('openSettings')}">
            ${ICONS['settings']}
          </a>
        </div>
      `;
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
