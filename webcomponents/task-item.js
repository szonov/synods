(function () {
const sheet = new CSSStyleSheet();
sheet.replaceSync(`
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
.container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 12px;
  height: 56px;

  &:hover {
    background: #eee;
  }

  &.locked {
    opacity: 0.3;
    background: #EEC!important;
    .actions {
      display: none;
    }
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .info {
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .title {
        font-size: 12px;
        line-height: 12px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
      }

      .status {
        display: flex;
        align-items: center;

        .icon {
          flex-shrink: 0;
          flex-grow: 0;
          display: flex;
          align-items: center;
          width: 14px;

          svg {
            width: 12px;
            height: 12px;
          }
        }
        .message {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 10px;
        }
      }
    }

    .actions {
      flex-grow: 0;
      flex-shrink: 0;
      a {
        text-decoration: none;
        color: #ccc;
        margin-left: 8px;
        margin-right: 2px;

        &:hover {
          color: #1a73e8;
          &[data-action="delete"] {
            color: #d93025;
          }
        }

        svg {
          width: 16px;
          height: 16px;
        }
      }
    }
  }
  progress {
      height: 10px;
  }
}

`);

const STATUSES = {
  waiting: {icon: 'clock', iconColor: '#888', textColor: '#888', accent: '#888'},
  downloading: {icon: 'down', textColor: '#444'},
  paused: {icon: 'paused', iconColor: '#888', textColor: '#888', accent: '#888'},
  finishing: {icon: 'down', textColor: '#444'},
  finished: {icon: 'check', iconColor: '#0d8050', textColor: '#444', accent: '#0d8050'},
  hash_checking: {icon: 'down', textColor: '#444'},
  seeding: {icon: 'up', textColor: '#444', accent: '#9a7026'},
  filehosting_waiting: {icon: 'clock', iconColor: '#888', textColor: '#888', accent: '#888'},
  extracting: {icon: 'down', iconColor: '#888', textColor: '#444', accent: '#888'},
  error: {icon: 'triangle', iconColor: '#C43B38', textColor: '#C43B38', accent: '#C43B38'},
};

const ICONS = {
  // --- statuses
  down: `<svg class="down" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M18 13l-6 6"/><path d="M6 13l6 6"/></svg>`,
  up: `<svg class="up" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M18 11l-6 -6"/><path d="M6 11l6 -6"/></svg>`,
  check: `<svg class="check"  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l5 5l10 -10" /></svg>`,
  clock: `<svg class="clock" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-5 2.66a1 1 0 0 0 -.993 .883l-.007 .117v5l.009 .131a1 1 0 0 0 .197 .477l.087 .1l3 3l.094 .082a1 1 0 0 0 1.226 0l.094 -.083l.083 -.094a1 1 0 0 0 0 -1.226l-.083 -.094l-2.707 -2.708v-4.585l-.007 -.117a1 1 0 0 0 -.993 -.883z"/></svg>`,
  triangle: `<svg class="triangle" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  paused: `<svg class="pause" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" /><path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" /></svg>`,

  // --- actions
  pause: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/></svg>`,
  resume: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>`,
  delete: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
};

const VISIBILITY = {
  pause: ['downloading', 'hash_checking', 'waiting', 'seeding'],
  resume: ['paused', 'finished', 'error'],
};

class TaskItem extends HTMLElement {
  constructor() {
    super();
    // normal task values
    this.taskId = '';
    this.taskTitle = 'Untitled'; // can not use single `title`, document.createElement('task-item') failed then
    this.status = 'waiting';
    this.size = 0;
    this.sizeDownloaded = 0;
    this.sizeUploaded = 0;
    this.speedDownload = 0;
    this.speedUpload = 0;
    this.errorDetails = '';
    // console.log('constructor');

    // additional values
    this.isLocked = false;

    this.attachShadow({mode: 'open'});
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this.shadowRoot.innerHTML = `
      <div class="container" data-status="finished">
        <header>
            <div class="info">
                <div class="title"><!-- title -->&nbsp;</div>
                <div class="status">
                    <div class="icon"></div>
                    <div class="message"><!-- status message -->&nbsp;</div>
                </div>
            </div>

            <div class="actions">
                <a href="" data-action="resume" style="display: none" title="${chrome.i18n.getMessage('resume')}">
                    ${ICONS['resume']}
                </a>
                <a href="" data-action="pause" style="display: none" title="${chrome.i18n.getMessage('pause')}">
                  ${ICONS['pause']}
                </a>
                <a href="" data-action="delete" style="display: none" title="${chrome.i18n.getMessage('remove')}">
                  ${ICONS['delete']}
                </a>
            </div>
        </header>
        <progress data-progress max="100" value="0" style="width: 100%">0%</progress>
      </div>
    `;
  }

  connectedCallback() {
    this.shadowRoot.querySelectorAll('[data-action]').forEach(($a) => {
      $a.addEventListener('click', (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this.dispatchEvent(new CustomEvent('action', { detail: $a.dataset.action }));
      });
    });
  }

  disconnectedCallback() {
    //
  }

  get percent() {
    return this.size <= 0 ? 0 : Math.round((100 * this.sizeDownloaded) / this.size);
  }

  get eta() {
    const remaining = Math.round((this.size - this.sizeDownloaded) / this.speedDownload);
    if (Number.isFinite(remaining)) {
      return chrome.i18n.getMessage("eta_remaining", [
        TaskUtils.humanTime(remaining)
      ])
    }
    return chrome.i18n.getMessage("eta_no_estimate");
  }

  get statusConfig() {
    return STATUSES[this.status] ?? STATUSES['waiting'];
  }

  update(synoTask, isLocked = false) {
    // console.log('update');
    this.taskId = String(synoTask.id);
    this.status = synoTask.status;
    this.taskTitle = synoTask.title;
    this.size = TaskUtils.int(synoTask.size);
    this.sizeDownloaded = TaskUtils.int(synoTask.additional?.transfer?.size_downloaded);
    this.sizeUploaded = TaskUtils.int(synoTask.additional?.transfer?.size_uploaded);
    this.speedDownload = TaskUtils.int(synoTask.additional?.transfer?.speed_download);
    this.speedUpload = TaskUtils.int(synoTask.additional?.transfer?.speed_upload);
    this.errorDetails = TaskUtils.formatErrorDetails(synoTask.status_extra?.error_detail ?? "");

    (isLocked) ? this.lock(): this.unlock();

    this._updateActionIcon();
    this._updateTitle();
    this._updateStatusIcon();
    this._updateStatusMessage()
    this._updateProgress();
  }

  $q(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  _updateTitle() {
    this.$q('.title').textContent = this.taskTitle || 'Untitled';
  }

  _updateActionIcon() {
    this.$q(`[data-action="delete"]`).style.display = 'inline-block';

    this.$q(`[data-action="resume"]`).style.display = VISIBILITY['resume'].includes(this.status)
      ? 'inline'
      : 'none';

    this.$q(`[data-action="pause"]`).style.display = VISIBILITY['pause'].includes(this.status)
      ? 'inline'
      : 'none';
  }

  _updateStatusIcon() {
    const cfg = this.statusConfig;
    const $icon = this.$q(`.status > .icon`);
    $icon.innerHTML = ICONS[cfg.icon];
    $icon.style.color = cfg.iconColor || '';
  }

  _updateProgress() {
    const percent = this.percent;
    const $bar = this.$q(`progress`);
    $bar.textContent = `${percent}%`;
    $bar.value = percent;
    $bar.style.accentColor = this.statusConfig.accent || '';
  }

  _updateStatusMessage() {
    let message;

    switch (this.status)
    {
      case 'downloading':
      case 'extracting':
      case 'finishing':
      case 'hash_checking':
        message = chrome.i18n.getMessage('status_line_downloading', [
          `${this.percent}%`,
          this.eta,
          TaskUtils.humanSize(this.sizeDownloaded),
          TaskUtils.humanSize(this.size),
          TaskUtils.humanSpeed(this.speedDownload),
        ]);
        break;

      case 'seeding':
        message = chrome.i18n.getMessage('status_line_uploading', [
          (this.sizeUploaded / this.size).toFixed(2),
          TaskUtils.humanSize(this.sizeUploaded),
          TaskUtils.humanSpeed(this.speedUpload),
        ]);
        break;

      case 'finished':
        message = chrome.i18n.getMessage('status_line_downloaded', [
          TaskUtils.humanSize(this.size)
        ]);
        break;

      case 'error':
        message = this.errorDetails
          ? `${this.status.toUpperCase()} \u2013 ${this.errorDetails}`
          : `${this.status.toUpperCase()}`;
        break;

      default:
        message = chrome.i18n.getMessage('status_line_other', [
          this.status.toUpperCase(),
          `${this.percent}%`,
          TaskUtils.humanSize(this.sizeDownloaded),
          TaskUtils.humanSize(this.size),
        ]);
        break;
    }
    const $msg =this.$q(`.status > .message`)
    $msg.textContent = message;
    $msg.style.color = this.statusConfig.textColor || '';
  }

  lock() {
    this.isLocked = true;
    this.$q('.container').classList.add('locked');
  }

  unlock() {
    this.isLocked = false;
    this.$q('.container').classList.remove('locked');
  }
}

customElements.define('task-item', TaskItem);
})();
