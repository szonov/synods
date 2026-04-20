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
 * @param {number|string} speedInBytesPerSecond
 * @returns {string}
 */
export function humanSpeed(speedInBytesPerSecond) {
  if (speedInBytesPerSecond === "") {
    return "\u2013.\u2013 B/s"
  }
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

function formatErrorDetails(msg) {
  return msg === ""
    ? ""
    : msg
        .replace(/[^a-zA-Z0-9]/, " ")
        .replace(/\s+/, " ")
        .trim()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

class Task {
  constructor(synoTask, isLocked) {
    this.id = String(synoTask.id);
    this.status = synoTask.status;
    this.title = synoTask.title;
    this.size = int(synoTask.size);
    this.sizeDownloaded = int(synoTask.additional?.transfer?.size_downloaded);
    this.sizeUploaded = int(synoTask.additional?.transfer?.size_uploaded);
    this.speedDownload = int(synoTask.additional?.transfer?.speed_download);
    this.speedUpload = int(synoTask.additional?.transfer?.speed_upload);
    this.errorDetails = formatErrorDetails(synoTask.status_extra?.error_detail ?? "");
    this.isLocked = !!isLocked;

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

  /**
   * Render downloads data to HTML element
   *
   * @param {HTMLDivElement} $div
   */
  renderTo($div) {
    $div.dataset.status = this.status;
    $div.dataset.type = this.statusType;
    if (this.isLocked) {
      $div.classList.add("locked");
    } else {
      $div.classList.remove("locked");
    }
    this._renderTitle($div);
    this._renderProgressBar($div);
    this._renderStatusMessage($div);
    $div.querySelectorAll('status-icon, task-actions').forEach(($el) => {
      $el.dataset.status = this.status
    });
    // $div.querySelector('status-icon').dataset.status = this.status
    // $div.querySelector('task-actions').dataset.status = this.status
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

  _renderStatusMessage($div) {
    let message;

    switch (this.statusType) {
      case "downloading":
        message = chrome.i18n.getMessage("status_line_downloading", [
          `${this.percent}%`,
          this.etaMessage,
          humanSize(this.sizeDownloaded),
          humanSize(this.size),
          humanSpeed(this.speedDownload),
        ]);
        break;

      case "uploading":
        message = chrome.i18n.getMessage("status_line_uploading", [
          (this.sizeUploaded / this.size).toFixed(2),
          humanSize(this.sizeUploaded),
          humanSpeed(this.speedUpload),
        ]);
        break;

      case "completed":
        message = chrome.i18n.getMessage("status_line_downloaded", [humanSize(this.size)]);
        break;

      case "errored":
        message = this.errorDetails
          ? `${this.status.toUpperCase()} \u2013 ${this.errorDetails}`
          : `${this.status.toUpperCase()}`;
        break;

      case "other":
        message = chrome.i18n.getMessage("status_line_other", [
          this.status.toUpperCase(),
          `${this.percent}%`,
          humanSize(this.sizeDownloaded),
          humanSize(this.size),
        ]);
        break;
    }
    setProps($div, "[data-status-message]", { textContent: message });
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
   * @param lockedIds
   * @returns {{speedDownload: number, speedUpload: number}}
   */
  render(synoTaskList, lockedIds = {}) {
    let markedForDeletion = this._getAllTaskIds(),
      speedDownload = 0,
      speedUpload = 0,
      order = 1;

    synoTaskList.forEach((synoTask) => {
      const task = new Task(synoTask, lockedIds[synoTask.id]);
      const $div = this._getTaskDiv(task.id) ?? this._createTaskDiv(task.id);

      task.renderTo($div);

      $div.style.order = String(order++);
      if (!$div.isConnected) {
        this.$root.appendChild($div);
      }

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
   * Get list of task IDs with status = 'finished'
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
   * Get list of task IDs with status = 'finished'
   *
   * @returns {string[]}
   */
  getFinishedTaskIds() {
    let taskIds = [];
    this.$root.querySelectorAll(':scope > .task-item[data-status="finished"]').forEach(($div) => {
      taskIds.push($div.dataset.id);
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

  lock(taskId) {
    const $div = this._getTaskDiv(taskId)
    if ($div) {
      this._getTaskDiv(taskId).classList.add("locked");
    }
  }

  unlock(taskId) {
    const $div = this._getTaskDiv(taskId)
    if ($div) {
      this._getTaskDiv(taskId).classList.remove("locked");
    }
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
    $div.querySelector("task-actions").addEventListener("action", (e) => {
      this._callback(e.detail, taskId);
    });

    // setup events for action buttons
    // $div.querySelectorAll("action-button").forEach((btn) => {
    //   btn.addEventListener("action", (e) => {
    //     this._callback(e.detail, taskId);
    //   });
    // });
    // $div.querySelectorAll("action-button").forEach((btn) => {
    //   btn.addEventListener("action", (e) => {
    //     this._callback(e.detail, taskId);
    //   });
    // });

    return $div;
  }
}
