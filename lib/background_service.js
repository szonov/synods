/**
 * @import {ApiResponsePromise, FailedApiResponse, SuccessApiResponse} from './dsm_api/types.d.ts';
 *
 * @callback TaskActionFn
 * @param {string} id
 * @returns {ApiResponsePromise}
 *
 */

import { setBadge } from "./badge.js";
import { Api } from "./dsm_api/api.js";
import { sendMessage } from "./shared.js";

/**
 * Main class for handling extension state
 *
 * @property {Api} api
 */
class BackgroundService {
  /**
   * @param {Api} api
   */
  constructor(api) {
    this.api = api;

    // Map of locked task ids, where key is Task ID, value is boolean (always true)
    this._locked = {};

    // List of fetched tasks from Download Station
    this._tasks = [];

    // Unix time, store time when task list last time fetched
    this._updatedAt = 0;

    this._tasksFetchPromise = null;
  }

  getSettings () {
    return {
      host: this.api.host,
      account: this.api.account,
      passwd: this.api.passwd,
    }
  }

  getHost () {
    return this.api.host;
  }

  async latestTasks() {
    const now = Math.floor(Date.now() / 1000);
    if (now - this._updatedAt < 5) { // 5 sec cache
      await this._sendTasks();
    } else {
      await this._refreshTasks();
    }
  }

  async newTasks() {
    await this._refreshTasks();
  }

  async pauseTask(id) {
    await this._taskAction(id, this.api.pauseTask.bind(this.api));
  }

  async resumeTask(id) {
    await this._taskAction(id, this.api.resumeTask.bind(this.api));
  }

  async deleteTask(id) {
    await this._taskAction(id, this.api.deleteTask.bind(this.api));
  }

  async login(data) {

    this._locked = {};
    this._tasks = [];
    this._updatedAt = 0;

    await this._sendMissingConfig()

    const newSettings = {
      host: data.host.trim() || "",
      account: data.account.trim(),
      passwd: data.passwd,
    }
    const oldSettings = this.updateSettings({sid:"", ...newSettings});

    const response = await this.api.login();

    if (response.success) {
      await chrome.storage.local.set(newSettings);
      await this._refreshTasks();
      return {
        success: true,
        message: chrome.i18n.getMessage("loginSuccess"),
      };
    } else {
      this.updateSettings(oldSettings);
    }

    if (response.type !== "missing-config") {
      await setBadge(-1);
    }

    // TODO: i18n
    return { success: false, message: `${response.type}: ${response.message}` };
  }

  async logout() {
    this._locked = {};
    this._tasks = [];
    this._updatedAt = 0;

    await this._sendMissingConfig()

    const newSettings = {
      host: "",
      account: "",
      passwd: "",
      sid: "",
    };

    this.updateSettings(newSettings);
    await chrome.storage.local.set(newSettings);

    return { success: true };
  }

  async initializeBadge() {
    await this._refreshTasks();
  }

  async createDownloadTask(url) {
    if (this.api.isMissingConfig) {
      return await chrome.runtime.openOptionsPage();
    }

    const response = await this.api.createTask(url);

    if (response.success) {
      await chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon256-success.png",
        title: chrome.i18n.getMessage("taskAdded"),
        message: url,
      });
    } else {
      await chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon256-error.png",
        title: chrome.i18n.getMessage("failedToAddTask"),
        message: response.message || url,
      });
    }
    // TODO: refresh badge and list
  }

  updateSettings(settings) {
    return this.api.setSettings(settings);
  }

  /**
   *
   * @param {string} id
   * @param {TaskActionFn} taskFn
   * @returns {Promise<void>}
   */
  async _taskAction(id, taskFn) {
    if (this._locked[id]) {
      await sendMessage("app-error", { message: `task ${id} is locked` });
      return;
    }

    this._locked[id] = true;
    await sendMessage("lock-task", { id });

    const response = await taskFn(id);
    const ok = await this._checkApiResponse(response);

    delete this._locked[id];
    if (!ok) {
      await sendMessage("unlock-task", { id });
      return;
    }

    await this._refreshTasks();
  }

  async _fetchTasks() {
    const response = await this.api.getTasks("transfer");

    const ok = this._checkApiResponse(response);

    if (response.success) {
      this._tasks = response.data.tasks;
      this._updatedAt = Math.floor(Date.now() / 1000);
    }

    return ok;
  }

  async _refreshTasks() {
    if (this._tasksFetchPromise === null) {
      // Create a new promise
      this._tasksFetchPromise = (async () => {
        // console.log(`[Dedup] Executing new _dedupeFetchTasks`);
        const ok = await this._fetchTasks();
        // console.log(`[Dedup] _dedupeFetchTasks completed, removed from queue`);
        if (ok) await this._sendTasks();
        this._tasksFetchPromise = null;
        return ok;
      })();
    } else {
      // console.log(`[Dedup] refreshTasks already in flight, waiting...`);
    }

    return this._tasksFetchPromise;
  }

  /**
   *
   * @param {FailedApiResponse|SuccessApiResponse} response
   * @returns {Promise<boolean>} Should be execution continue
   */
  async _checkApiResponse(response) {
    if (response.success) {
      return true;
    }

    switch (response.type) {
      case "missing-config":
        await this._sendMissingConfig()
        break;

      default:
        if (this._tasks.length === 0) {
          await setBadge(-1);
        }

        // TODO: i18n ....
        await sendMessage("api-error", { message: `[${response.type}] ${response.message}` });
        break;
    }

    return false;
  }

  async _sendTasks() {
    const total = this._tasks.length;
    await setBadge(total);

    return sendMessage("task-list", {
      total: total,
      tasks: this._tasks,
      updatedAt: this._updatedAt,
      locked: this._locked,
    });
  }

  async _sendMissingConfig() {
    await sendMessage("missing-config");
    return setBadge(0);
  }
}

let service = null;

/**
 * @returns {Promise<BackgroundService>}
 */
export async function useService() {
  if (!service) {
    const api = new Api();
    api.onSidChange((sid) => chrome.storage.local.set({ sid }));

    service = new BackgroundService(api);

    const settings = await chrome.storage.local.get();
    service.updateSettings(settings || {});
  }
  return service;
}
