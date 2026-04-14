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
  const space = " "
  const bytes = int(sizeInBytes);
  if (bytes === 0) {
    return `0.00${space}B`;
  }
  const e = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, e)).toFixed(2)}${space}${' KMGTP'.charAt(e).
    trim()}B`;
}

/**
 * Calculate progress percentage, returns integer number
 *
 * @param {number} done
 * @param {number} total
 * @returns {number}
 */
function progress(done, total) {
  const d = int(done);
  const t = int(total);

  return t <= 0 ? 0 : Math.round((100 * d) / t);
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
 * Helper function to prevent XSS
 * Something similar php's `htmlspecialchars`
 *
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

/**
 * Returns only relevant usable data from the Synology api response
 * @deprecated
 * @param task
 * @returns {{id: string, status: *, title: *, sizeTotal: number, sizeDownloaded: number, sizeUploaded: number, speedDownload: number, speedUpload: number}}
 */
function transform(task) {
  task = task || {};
  const t =
    task.additional && task.additional.transfer
      ? task.additional.transfer
      : {};

  return {
    id: String(task.id),
    status: task.status,
    title: task.title,

    sizeTotal: int(task.size),
    sizeDownloaded: int(t.size_downloaded),
    sizeUploaded: int(t.size_uploaded),
    speedDownload: int(t.speed_download),
    speedUpload: int(t.speed_upload),
  };
}

export class DownloadsList {

  /**
   * Constructor of task list object
   * @param {HTMLElement} root root element for rendering tasks
   * @param {HTMLTemplateElement} template template for single download task
   */
  constructor(root, template) {
    // root HTML element for rendering tasks
    this._root = root;

    // template for single download task
    this._template = template;

    // callback for tasks events
    this._callback = function(eventName, id) {};

    // last update date and time
    this.updatedAt = null;

    // total speed of download in bytes/second
    this.speedDownload = 0;

    // total speed of upload in bytes/second
    this.speedUpload = 0;
  }

  render(synoTaskList) {
    let speedDownload = 0,
      speedUpload = 0,
      order = 0;

    let deletable = this._shownTaskIds();
    synoTaskList = Array.isArray(synoTaskList) ? synoTaskList : [];

    synoTaskList.forEach((task) => {
      // generate new task order
      order++;

      this._renderTask(task, order);

      // totals
      speedDownload += task.additional.transfer.speed_download;
      speedUpload += task.additional.transfer.speed_upload;

      delete deletable[task.id];
    });

    // remove tasks which not come from Synology
    Object.keys(deletable).forEach((taskId) => this._removeTask(taskId));

    // update class variables
    this.updatedAt = new Date();
    this.speedDownload = speedDownload;
    this.speedUpload = speedUpload;
  }

  /**
   * Setup own callback for tasks events (pause, resume, remove)
   *
   * @param {{ (event: string, id: string): void }} callback
   */
  onEvent(callback) {
    if (typeof callback === 'function')
    {
      this._callback = callback;
    }
  }

  /**
   * Get list of task IDs attached to DOM document in a format convenient for further use
   *
   * @returns {{taskId1: boolean, taskId2: boolean}}
   * @private
   */
  _shownTaskIds() {
    let taskIds = {};
    const tasks = this._root.querySelectorAll(':scope > .task-item');
    tasks.forEach((taskEl) => {
      taskIds[taskEl.dataset.id] = true;
    });
    return taskIds;
  }

  _renderTask(task, order) {

    const taskEl = this._getTaskEl(task.id) ?? this._createTaskEl(task.id);

    taskEl.style.order = order;
    taskEl.className = `task-item status-${task.status}`;

    // helpers for updating taskEl
    const set = (selector, props) => {
      taskEl.querySelectorAll(selector).forEach(($el) => {
        for (const key in props)
        {
          $el[key] = props[key];
        }
      });
    };
    const icon = (value) => {
      set('[data-status-icon]', {innerHTML: value});
    };

    const msg = (key, ...params) => {
      set('[data-status-message]', {
        textContent: chrome.i18n.getMessage(key, params),
      });
    };

    const percent = this._computeProgress(task);

    // title
    set('[data-title]', {textContent: escapeHtml(task.title)});

    // progress bar
    set('[data-progress]', {textContent: `${percent}%`, value: percent});

    // status line with icon
    switch (task.status)
    {
      case 'downloading':
      case 'extracting':
      case 'finishing':
      case 'hash_checking':
        // downloading ...
        icon(this._iconDown());

        const eta = this._computeETA(task);

        msg('status_line_downloading',
          `${percent}%`,
          eta != null
            ? chrome.i18n.getMessage("eta_remaining", [humanTime(eta)])
            : chrome.i18n.getMessage('eta_no_estimate'),
          `${humanSize(task.additional.transfer.size_downloaded)}`,
          `${humanSize(task.size)}`,
          `${humanSize(task.additional.transfer.speed_download)}/s`,
        );
        break;

      case 'seeding':
        // uploading ...
        icon(this._iconUp());
        msg('status_line_uploading',
          `${(task.additional.transfer.size_uploaded / task.size).toFixed(2)}`,
          `${humanSize(task.additional.transfer.size_uploaded)}`,
          `${humanSize(task.additional.transfer.speed_upload)}/s`,
        );
        break;

      case 'finished':
        // completed ...
        icon(this._iconCheck());
        msg('status_line_downloaded', humanSize(task.size));
        break;

      case 'error':
        // error ...
        icon(this._iconTriangle());
        let errorMessage;
        if (task.status_extra?.error_detail) {
          errorMessage = `${task.status.toUpperCase()} \u2013 ${task.status_extra.error_detail}`
        } else {
          errorMessage = `${task.status.toUpperCase()}`
        }
        set('[data-status-message]', {
          textContent: errorMessage,
        });
        break;

      default:
        // others ...
        icon( this._iconClock() );
        msg('status_line_other',
          task.status.toUpperCase(),
          `${percent}%`,
          `${humanSize(task.additional.transfer.size_downloaded)}`,
          `${humanSize(task.size)}`,
        );
        break;
    }

    // attach to DOM (if not attached yet)
    if (!taskEl.isConnected)
    {
      this._root.appendChild(taskEl);
    }
  }


  /**
   * Calculate progress percentage, returns integer number
   *
   * @param task
   * @returns {number}
   */
  _computeProgress(task) {
    const d = task.additional.transfer.size_downloaded;
    const t = task.size;

    return t <= 0 ? 0 : Math.round((100 * d) / t);
  }

  /**
   * Calculates the number of seconds remaining until the download is complete.
   *
   * @param task
   * @returns {number|null}
   * @private
   */
  _computeETA(task) {
    const secondsRemaining = Math.round((task.size - task.additional.transfer.size_downloaded) / task.additional.transfer.speed_download);
    return Number.isFinite(secondsRemaining) ? secondsRemaining : null;
  }

  /**
   * Returns task's DOM element
   *
   * @param {string} taskId
   * @returns {HTMLDivElement|undefined}
   * @private
   */
  _getTaskEl(taskId) {
    return this._root.querySelector(`[data-id="${taskId}"]`);
  }

  /**
   * Creates DOM element for task and attach action events
   *
   * @param {string} taskId
   * @returns {HTMLDivElement}
   * @private
   */
  _createTaskEl(taskId) {

    // create new HTMLDivElement
    const taskEl = document.createElement('div');

    // as content use innerHTML from template on the page
    taskEl.append(this._template.content.cloneNode(true));

    taskEl.dataset.id = taskId;
    taskEl.className = `task-item`;

    // setup events for action buttons
    taskEl.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this._callback(btn.dataset.action, taskId);
      });
    });

    return taskEl;
  }

  /**
   * Removes task's DOM element from document
   *
   * @param {string} taskId
   * @private
   */
  _removeTask(taskId) {
    this._getTaskEl(taskId)?.remove();
  }

  _iconDown() {
    return `<svg class="icon-down" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M18 13l-6 6"/><path d="M6 13l6 6"/></svg>`;
  }

  _iconUp() {
    return `<svg class="icon-up" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14"/><path d="M18 11l-6 -6"/><path d="M6 11l6 -6"/></svg>`;
  }

  _iconCheck() {
    return `<svg class="icon-check" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
  }

  _iconClock() {
    return `<svg class="icon-clock" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-5 2.66a1 1 0 0 0 -.993 .883l-.007 .117v5l.009 .131a1 1 0 0 0 .197 .477l.087 .1l3 3l.094 .082a1 1 0 0 0 1.226 0l.094 -.083l.083 -.094a1 1 0 0 0 0 -1.226l-.083 -.094l-2.707 -2.708v-4.585l-.007 -.117a1 1 0 0 0 -.993 -.883z"/></svg>`;
  }

  _iconTriangle() {
    return `<svg class="icon-triangle" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
  }

  /**
   * Getter for human-readable total download speed
   *
   * @returns {string}
   */
  get humanSpeedDownload() {
    return humanSize(this.speedDownload) + '/s';
  }

  /**
   * Getter for human-readable total upload speed
   *
   * @returns {string}
   */
  get humanSpeedUpload() {
    return humanSize(this.speedUpload) + '/s';
  }
}
