(function () {
  const sheet = new CSSStyleSheet();
  const css = `<style>
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

        svg-icon {
          flex-shrink: 0;
          flex-grow: 0;
          display: flex;
          align-items: center;
          width: 14px;
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
      }
    }
  }
  progress {
      height: 10px;
  }
}
</style>`;

  sheet.replaceSync(css.slice(8, -8));

  const STATUSES = {
    waiting: {
      action: 'pause', icon: "clock", iconColor: "#888", textColor: "#888", accent: "#888"
    },
    downloading: {
      action: 'pause', icon: "down", textColor: "#444"
    },
    paused: {
      action: 'resume', icon: "paused", iconColor: "#888", textColor: "#888", accent: "#888"
    },
    finishing: {
      icon: "down", textColor: "#444"
    },
    finished: {
      action: 'resume', icon: "check", iconColor: "#0d8050", textColor: "#444", accent: "#0d8050"
    },
    hash_checking: {
      action: 'pause', icon: "down", textColor: "#444"
    },
    seeding: {
      action: 'pause', icon: "up", textColor: "#444", accent: "#9a7026"
    },
    filehosting_waiting: {
      icon: "clock", iconColor: "#888", textColor: "#888", accent: "#888"
    },
    extracting: {
      icon: "down", iconColor: "#888", textColor: "#444", accent: "#888"
    },
    error: {
      action: 'resume', icon: "triangle", iconColor: "#C43B38", textColor: "#C43B38", accent: "#C43B38"
    },
  };

  class TaskItem extends HTMLElement {
    constructor() {
      super();
      // normal task values
      this.taskId = "";
      this.taskTitle = "Untitled"; // can not use single `title`, document.createElement('task-item') failed then
      this.status = "waiting";
      this.size = 0;
      this.sizeDownloaded = 0;
      this.sizeUploaded = 0;
      this.speedDownload = 0;
      this.speedUpload = 0;
      this.errorDetails = "";
      // console.log('constructor');

      // additional values
      this.isLocked = false;

      this.attachShadow({ mode: "open" });
      this.shadowRoot.adoptedStyleSheets = [sheet];
      this.shadowRoot.innerHTML = `
      <div class="container" data-status="finished">
        <header>
            <div class="info">
                <div class="title">&nbsp;</div>
                <div class="status">
                    <svg-icon name="clock" size="12"></svg-icon>
                    <div class="message">&nbsp;</div>
                </div>
            </div>

            <div class="actions">
                <a href="" data-action="resume" style="display: none" data-i18n="title,resume">
                  <svg-icon name="resume" size="16"></svg-icon>
                </a>
                <a href="" data-action="pause" style="display: none" data-i18n="title,pause">
                  <svg-icon name="pause" size="16"></svg-icon>
                </a>
                <a href="" data-action="delete" style="display: none"  data-i18n="title,remove">
                  <svg-icon name="delete" size="16"></svg-icon>
                </a>
            </div>
        </header>
        <progress data-progress max="100" value="0" style="width: 100%">0%</progress>
      </div>
    `;
      Utils.applyI18n(this.shadowRoot)
    }

    connectedCallback() {
      this.shadowRoot.querySelectorAll("[data-action]").forEach(($a) => {
        $a.addEventListener("click", (e) => {
          if (e && e.preventDefault) e.preventDefault();
          this.dispatchEvent(new CustomEvent("action", { detail: $a.dataset.action }));
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
        return chrome.i18n.getMessage("eta_remaining", [Utils.humanTime(remaining)]);
      }
      return chrome.i18n.getMessage("eta_no_estimate");
    }

    get statusConfig() {
      return STATUSES[this.status] ?? STATUSES["waiting"];
    }

    update(synoTask, isLocked = false) {
      // console.log('update');
      this.taskId = String(synoTask.id);
      this.status = synoTask.status;
      this.taskTitle = synoTask.title;
      this.size = Utils.int(synoTask.size);
      this.sizeDownloaded = Utils.int(synoTask.additional?.transfer?.size_downloaded);
      this.sizeUploaded = Utils.int(synoTask.additional?.transfer?.size_uploaded);
      this.speedDownload = Utils.int(synoTask.additional?.transfer?.speed_download);
      this.speedUpload = Utils.int(synoTask.additional?.transfer?.speed_upload);
      this.errorDetails = Utils.formatErrorDetails(synoTask.status_extra?.error_detail ?? "");

      isLocked ? this.lock() : this.unlock();

      this._updateActionIcon();
      this._updateTitle();
      this._updateStatusIcon();
      this._updateStatusMessage();
      this._updateProgress();
    }

    $q(selector) {
      return this.shadowRoot.querySelector(selector);
    }

    _updateTitle() {
      this.$q(".title").textContent = this.taskTitle || "Untitled";
    }

    _updateActionIcon() {
      const cfg = this.statusConfig;
      this.$q(`[data-action="delete"]`).style.display = "inline-block";

      this.$q(`[data-action="resume"]`).style.display = cfg.action === "resume"
        ? "inline"
        : "none";

      this.$q(`[data-action="pause"]`).style.display = cfg.action === "pause"
        ? "inline"
        : "none";
    }

    _updateStatusIcon() {
      const cfg = this.statusConfig;
      const $icon = this.$q(`.status > svg-icon`);
      $icon.name = cfg.icon
      $icon.style.color = cfg.iconColor || "";
    }

    _updateProgress() {
      const percent = this.percent;
      const $bar = this.$q(`progress`);
      $bar.textContent = `${percent}%`;
      $bar.value = percent;
      $bar.style.accentColor = this.statusConfig.accent || "";
    }

    _updateStatusMessage() {
      let message;

      switch (this.status) {
        case "downloading":
        case "extracting":
        case "finishing":
        case "hash_checking":
          message = chrome.i18n.getMessage("status_line_downloading", [
            `${this.percent}%`,
            this.eta,
            Utils.humanSize(this.sizeDownloaded),
            Utils.humanSize(this.size),
            Utils.humanSpeed(this.speedDownload),
          ]);
          break;

        case "seeding":
          message = chrome.i18n.getMessage("status_line_uploading", [
            (this.sizeUploaded / this.size).toFixed(2),
            Utils.humanSize(this.sizeUploaded),
            Utils.humanSpeed(this.speedUpload),
          ]);
          break;

        case "finished":
          message = chrome.i18n.getMessage("status_line_downloaded", [
            Utils.humanSize(this.size),
          ]);
          break;

        case "error":
          message = this.errorDetails
            ? `${this.status.toUpperCase()} \u2013 ${this.errorDetails}`
            : `${this.status.toUpperCase()}`;
          break;

        default:
          message = chrome.i18n.getMessage("status_line_other", [
            this.status.toUpperCase(),
            `${this.percent}%`,
            Utils.humanSize(this.sizeDownloaded),
            Utils.humanSize(this.size),
          ]);
          break;
      }
      const $msg = this.$q(`.status > .message`);
      $msg.textContent = message;
      $msg.style.color = this.statusConfig.textColor || "";
    }

    lock() {
      this.isLocked = true;
      this.$q(".container").classList.add("locked");
    }

    unlock() {
      this.isLocked = false;
      this.$q(".container").classList.remove("locked");
    }
  }

  customElements.define("task-item", TaskItem);
})();
