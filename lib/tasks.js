/**
 * Make integer number from any value, if value invalid 0 returned
 *
 * @param value
 * @returns {number}
 */
function int(value) {
  const v = parseInt(value);
  return isNaN(v) || v <= 0 ? 0 : v;
}

/**
 * Converts size in bytes to human-readable value
 *
 * @param {number} sizeInBytes
 * @returns {string}
 */
function humanSize(sizeInBytes) {
  const space = " ";
  const bytes = int(sizeInBytes);
  if (bytes === 0) {
    return `0.00${space}B`;
  }
  const e = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, e)).toFixed(2)}${space}${" KMGTP".charAt(e).trim()}B`;
}

/**
 * Converts speed in bytes per second to human-readable value
 *
 * @param {number} speedInBytesPerSecond
 * @returns {string}
 */
export function humanSpeed(speedInBytesPerSecond) {
  return humanSize(speedInBytesPerSecond) + "/s";
}

/**
 * Format seconds to human-readable time string
 *
 * @param {number} s
 * @returns {string}
 */
function humanTime(s) {
  const hours = Math.floor(s / (60 * 60));
  const minutes = Math.floor(s / 60) - hours * 60;
  const seconds = Math.floor(s) - hours * 60 * 60 - minutes * 60;

  function withZero(n) {
    return n > 9 ? n.toString() : `0${n.toString()}`;
  }

  return `${hours ? hours + ":" : ""}${hours ? withZero(minutes) : minutes}:${withZero(seconds)}`;
}

/**
 * Helper function to prevent XSS (something similar php's `htmlspecialchars`)
 *
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

export function setProps($root, selector, props) {
  $root.querySelectorAll(selector).forEach(($el) => {
    for (const key in props) {
      $el[key] = props[key];
    }
  });
}
function iconDown() {
  return `<svg class="icon-down" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M18 13l-6 6"/><path d="M6 13l6 6"/></svg>`;
}

function iconUp() {
  return `<svg class="icon-up" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M18 11l-6 -6"/><path d="M6 11l6 -6"/></svg>`;
}

function iconCheck() {
  return `<svg class="icon-check" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
}

function iconClock() {
  return `<svg class="icon-clock" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-5 2.66a1 1 0 0 0 -.993 .883l-.007 .117v5l.009 .131a1 1 0 0 0 .197 .477l.087 .1l3 3l.094 .082a1 1 0 0 0 1.226 0l.094 -.083l.083 -.094a1 1 0 0 0 0 -1.226l-.083 -.094l-2.707 -2.708v-4.585l-.007 -.117a1 1 0 0 0 -.993 -.883z"/></svg>`;
}

function iconTriangle() {
  return `<svg class="icon-triangle" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
}

class Task {
  constructor(synoTask) {
    this.id = String(synoTask.id);
    this.status = synoTask.status;
    this.title = synoTask.title;
    this.size = int(synoTask.size);
    this.sizeDownloaded = int(synoTask.additional?.transfer?.size_downloaded);
    this.sizeUploaded = int(synoTask.additional?.transfer?.size_uploaded);
    this.speedDownload = int(synoTask.additional?.transfer?.speed_download);
    this.speedUpload = int(synoTask.additional?.transfer?.speed_upload);
    this.errorDetails = String(synoTask.status_extra?.error_detail ?? "");

    // lazy loaded values
    this._percent = undefined;
    this._statusType = undefined;
    this._eta = undefined;
  }

  get percent() {
    if (this._percent !== undefined) {
      return this._percent;
    }

    return (this._percent =
      this.size <= 0 ? 0 : Math.round((100 * this.sizeDownloaded) / this.size));
  }

  get statusType() {
    if (this._statusType !== undefined) {
      return this._statusType;
    }
    if (["downloading", "extracting", "finishing", "hash_checking"].includes(this.status)) {
      return (this._statusType = "downloading");
    }
    if (["seeding"].includes(this.status)) {
      return (this._statusType = "uploading");
    }
    if (["finished"].includes(this.status)) {
      return (this._statusType = "completed");
    }
    if (["error"].includes(this.status)) {
      return (this._statusType = "errored");
    }
    return (this._statusType = "other");
  }

  get eta() {
    if (this._eta !== undefined) {
      return this._eta;
    }
    const remaining = Math.round((this.size - this.sizeDownloaded) / this.speedDownload);
    return (this._eta = Number.isFinite(remaining) ? remaining : null);
  }

  get etaMessage() {
    return this.eta !== null
      ? chrome.i18n.getMessage("eta_remaining", [humanTime(this.eta)])
      : chrome.i18n.getMessage("eta_no_estimate");
  }

  get isPauseVisible() {
    return ["downloading", "seeding"].includes(this.status);
  }

  get isResumeVisible() {
    return ["waiting", "paused", "finished", "error"].includes(this.status);
  }

  /**
   * Render downloads data to HTML element
   *
   * @param {HTMLDivElement} $div
   */
  renderTo($div) {
    $div.className = `task-item status-${this.statusType}`;
    this._renderTitle($div);
    this._renderProgressBar($div);
    this._renderStatusLine($div);
    this._setResumeVisibility($div);
    this._setPauseVisibility($div);
  }

  _renderTitle($div) {
    setProps($div, "[data-title]", {
      textContent: escapeHtml(this.title),
    });
  }

  _renderProgressBar($div) {
    setProps($div, "[data-progress]", {
      textContent: `${this.percent}%`,
      value: this.percent,
    });
  }

  _renderStatusLine($div) {
    let icon, message;

    switch (this.statusType) {
      case "downloading":
        icon = iconDown();
        message = chrome.i18n.getMessage("status_line_downloading", [
          `${this.percent}%`,
          this.etaMessage,
          humanSize(this.sizeDownloaded),
          humanSize(this.size),
          humanSpeed(this.speedDownload),
        ]);
        break;

      case "uploading":
        icon = iconUp();
        message = chrome.i18n.getMessage("status_line_uploading", [
          (this.sizeUploaded / this.size).toFixed(2),
          humanSize(this.sizeUploaded),
          humanSpeed(this.speedUpload),
        ]);
        break;

      case "completed":
        icon = iconCheck();
        message = chrome.i18n.getMessage("status_line_downloaded", [humanSize(this.size)]);
        break;

      case "errored":
        icon = iconTriangle();
        message = this.errorDetails
          ? `${this.status.toUpperCase()} \u2013 ${this.errorDetails}`
          : `${this.status.toUpperCase()}`;
        break;

      case "other":
        icon = iconClock();
        message = chrome.i18n.getMessage("status_line_other", [
          this.status.toUpperCase(),
          `${this.percent}%`,
          humanSize(this.sizeDownloaded),
          humanSize(this.size),
        ]);
        break;
    }
    setProps($div, "[data-status-icon]", { innerHTML: icon });
    setProps($div, "[data-status-message]", { textContent: message });
  }

  _setResumeVisibility($div) {
    setProps($div, '[data-action="resume"]', {
      className: this.isResumeVisible ? "" : "d-none",
    });
  }
  _setPauseVisibility($div) {
    setProps($div, '[data-action="pause"]', {
      className: this.isPauseVisible ? "" : "d-none",
    });
  }
}

export class TaskList {
  /**
   * Constructor of task list object
   * @param {HTMLElement} $root root element for rendering tasks
   * @param {HTMLTemplateElement} $template template for single download task
   */
  constructor($root, $template) {
    // root HTML element for rendering tasks
    this.$root = $root;

    // template for single download task
    this.$template = $template;

    // callback for tasks events
    this._callback = function (eventName, id) {};
  }

  /**
   * Renders downloads come from Synology api to the page
   *
   * @param {Array} synoTaskList
   * @returns {{speedDownload: number, speedUpload: number}}
   */
  render(synoTaskList) {
    let markedForDeletion = this._getAllTaskIds(),
      speedDownload = 0,
      speedUpload = 0,
      order = 1;

    synoTaskList.forEach((synoTask) => {
      const task = new Task(synoTask);
      const $div = this._getTaskDiv(task.id) ?? this._createTaskDiv(task.id);

      task.renderTo($div);

      $div.style.order = String(order++);
      if (!$div.isConnected) this.$root.appendChild($div);

      // totals
      speedDownload += task.speedDownload;
      speedUpload += task.speedUpload;

      delete markedForDeletion[task.id];
    });

    // remove tasks which not come from api
    Object.keys(markedForDeletion).forEach((taskId) => {
      this._getTaskDiv(taskId)?.remove();
    });

    return { speedDownload, speedUpload };
  }

  /**
   * Setup own callback for tasks events (pause, resume, remove)
   *
   * @param {{ (event: string, id: string): void }} callback
   */
  onEvent(callback) {
    this._callback = callback;
  }

  /**
   * Get list of task IDs attached to DOM document in a format convenient for further use
   *
   * @returns {{taskId1: boolean, taskId2: boolean}}
   * @private
   */
  _getAllTaskIds() {
    let taskIds = {};
    this.$root.querySelectorAll(":scope > .task-item").forEach(($div) => {
      taskIds[$div.dataset.id] = true;
    });
    return taskIds;
  }

  /**
   * Returns task's DOM element
   *
   * @param {string} taskId
   * @returns {HTMLDivElement|undefined}
   * @private
   */
  _getTaskDiv(taskId) {
    return this.$root.querySelector(`[data-id="${taskId}"]`);
  }

  /**
   * Creates DOM element for task and attach action events
   *
   * @param {string} taskId
   * @returns {HTMLDivElement}
   * @private
   */
  _createTaskDiv(taskId) {
    // create new HTMLDivElement
    const $div = document.createElement("div");

    // as content use innerHTML from template on the page
    $div.append(this.$template.content.cloneNode(true));

    $div.dataset.id = taskId;
    $div.className = `task-item`;

    // setup events for action buttons
    $div.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this._callback(btn.dataset.action, taskId);
      });
    });

    return $div;
  }
}
