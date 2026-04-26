import * as U from "./task_utils.js";

const REFRESH_INTERVAL = 5000;

/**
 * @import { SynoTaskItem, PopupPageComponent } from "./types.d.ts";
 */

/**
 * @returns {PopupPageComponent}
 */
export default () => ({
  tasks: [],

  speedDownload: "--",
  speedUpload: "--",
  updatedAt: "--",

  stateMessage: "loading",
  errorMessage: "",

  refreshTimer: 0,
  _listener: null,

  init: async function () {
    this._listener = this._handleMessage.bind(this);
    chrome.runtime.onMessage.addListener(this._listener);
    chrome.runtime.sendMessage({ action: "latest-tasks" }).then(() => {});
  },

  destroy: function () {
    clearTimeout(this.refreshTimer);
    chrome.runtime.onMessage.removeListener(this._listener);
    this._listener = null;
  },

  openDsm: async function () {
    const host = await chrome.runtime.sendMessage({ action: "get-host" });
    if (host) {
      await chrome.tabs.create({
        url: `${host}/index.cgi?launchApp=SYNO.SDS.DownloadStation.Application`,
        active: true,
      });
    } else {
      await chrome.runtime.openOptionsPage();
    }
  },

  openSettings: async function () {
    await chrome.runtime.openOptionsPage();
  },

  runAction: async function (action, id) {
    this._lock(id);
    await chrome.runtime.sendMessage({ action, data: { id } });
  },

  _scheduleRefresh: function () {
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(async () => {
      await chrome.runtime.sendMessage({ action: "new-tasks" });
    }, REFRESH_INTERVAL);
  },

  _lock: function (taskId, locked = true) {
    for (let i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].id === taskId) {
        this.tasks[i].locked = !!locked;
        return;
      }
    }
  },

  _handleMessage: function (msg) {
    const data = msg.data || {};

    switch (msg.action) {
      case "lock-task":
        this._lock(data.id);
        break;

      case "unlock-task":
        this._lock(data.id, false);
        break;

      case "missing-config":
        this.stateMessage = "missingConfig";
        this.tasks = [];
        break;

      case "app-error":
      case "api-error":
        this.errorMessage = data.message;
        break;

      case "task-list":
        let tasks = [],
          speedDownload = 0,
          speedUpload = 0;

        data.tasks.forEach(
          /** @param {SynoTaskItem} synoTask */ (synoTask) => {
            speedDownload += U.int(synoTask.additional?.transfer?.speed_download);
            speedUpload += U.int(synoTask.additional?.transfer?.speed_upload);

            tasks.push(this._transform(synoTask, !!data.locked[synoTask.id]));
          },
        );

        this.speedDownload = U.humanSpeed(speedDownload);
        this.speedUpload = U.humanSpeed(speedUpload);
        this.updatedAt = Number.isFinite(data.updatedAt) ? new Date(data.updatedAt * 1000).toLocaleTimeString() : "--";
        this.tasks = tasks;
        this.stateMessage = tasks.length > 0 ? "" : "noActiveTasks";
        this.errorMessage = "";
        this._scheduleRefresh();

        break;
    }
  },

  /**
   *
   * @param {SynoTaskItem} synoTask
   * @param {boolean} locked
   * @returns
   */
  _transform: function (synoTask, locked) {
    const size = U.int(synoTask.size);
    const size_downloaded = U.int(synoTask.additional?.transfer?.size_downloaded);
    const size_uploaded = U.int(synoTask.additional?.transfer?.size_uploaded);
    const speed_download = U.int(synoTask.additional?.transfer?.speed_download);
    const speed_upload = U.int(synoTask.additional?.transfer?.speed_upload);

    const id = synoTask.id;
    const title = synoTask.title || "Untitled";
    const status = synoTask.status;
    const statusIcon =
      {
        waiting: "clock",
        downloading: "down",
        paused: "paused",
        finishing: "down",
        finished: "check",
        hash_checking: "down",
        seeding: "up",
        filehosting_waiting: "clock",
        extracting: "down",
        error: "triangle",
      }[status] ?? "clock";

    const canPause = ["waiting", "downloading", "hash_checking", "seeding"].includes(status);
    const canResume = ["paused", "finished", "error"].includes(status);

    const percent = U.percent(size_downloaded, size);

    let subtitle;

    switch (status) {
      case "downloading":
      case "extracting":
      case "finishing":
      case "hash_checking":
        const remaining = U.remaining(size_downloaded, size, speed_download);
        subtitle = chrome.i18n.getMessage("status_line_downloading", [
          `${percent}%`,
          U.humanEta(remaining),
          U.humanSize(size_downloaded),
          U.humanSize(size),
          U.humanSpeed(speed_download),
        ]);
        break;

      case "seeding":
        subtitle = chrome.i18n.getMessage("status_line_uploading", [
          U.ratio(size_uploaded, size).toFixed(2),
          U.humanSize(size_uploaded),
          U.humanSpeed(speed_upload),
        ]);
        break;

      case "finished":
        subtitle = chrome.i18n.getMessage("status_line_downloaded", [U.humanSize(size)]);
        break;

      case "error":
        const details = synoTask.status_extra?.error_detail ?? "";
        subtitle = details ? `${status.toUpperCase()} \u2013 ${U.humanError(details)}` : `${status.toUpperCase()}`;
        break;

      default:
        subtitle = chrome.i18n.getMessage("status_line_other", [
          status.toUpperCase(),
          `${percent}%`,
          U.humanSize(size_downloaded),
          U.humanSize(size),
        ]);
        break;
    }

    return { locked, id, status, title, statusIcon, canPause, canResume, percent, subtitle };
  },

  __: function (name, ...args) {
    return chrome.i18n.getMessage(name, args);
  },
});
