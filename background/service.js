/**
 * @import {ApiResponsePromise, FailedApiResponse, SuccessApiResponse} from './dsm_api/types.d.ts';
 *
 * @callback TaskActionFn
 * @param {string} id
 * @returns {ApiResponsePromise}
 *
 */

import { Api } from "./dsm_api/api.js";

async function sendMessage(action, data) {
  // console.log(`[sendMessage.${action}]`, data);
  try {
    return await chrome.runtime.sendMessage({ action, data });
  } catch (error) {
    // console.log("[sendMessage.error] ", error);
  }
}

async function setBadgeTextColor(text = "", color = "#ffffff") {
  await chrome.action.setBadgeText({ text });
  return await chrome.action.setBadgeBackgroundColor({ color });
}

function setBadge(count) {
  if (count < 0) return setBadgeTextColor("!", "#C43B38");
  else if (count > 0) return setBadgeTextColor(String(count), "#0d8050");
  else return setBadgeTextColor();
}

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
    this.accounts = [];
    this.activeAccountId = "";

    // Map of locked task ids, where key is Task ID, value is boolean (always true)
    this._locked = {};

    // List of fetched tasks from Download Station
    this._tasks = [];

    // Unix time, store time when task list last time fetched
    this._updatedAt = 0;

    this._tasksFetchPromise = null;
    this._accountGeneration = 0;
  }

  getSettings () {
    return {
      accounts: this.accounts.map(({ sid, ...account }) => account),
      activeAccountId: this.activeAccountId,
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

  async saveAccount(data) {
    const account = {
      id: data.id || crypto.randomUUID(),
      name: data.name.trim(),
      host: data.host.trim(),
      account: data.account.trim(),
      passwd: data.passwd,
      sid: "",
    };
    const duplicate = this.accounts.some((item) => item.id !== account.id && item.name === account.name);
    if (duplicate) return { success: false, message: chrome.i18n.getMessage("accountNameUnique") };

    const testApi = new Api(account);
    const response = await testApi.login();
    if (!response.success) return { success: false, message: `${response.type}: ${response.message}` };
    account.sid = testApi.sid;

    const index = this.accounts.findIndex((item) => item.id === account.id);
    if (index >= 0) this.accounts[index] = account;
    else this.accounts.push(account);
    if (!this.activeAccountId) this.activeAccountId = account.id;
    await this._persistAccounts();
    if (this.activeAccountId === account.id) {
      this._activateAccount(account);
      await this._refreshTasks();
    }
    return { success: true, id: account.id, message: chrome.i18n.getMessage("loginSuccess") };
  }

  async deleteAccount(id) {
    const wasActive = id === this.activeAccountId;
    const index = this.accounts.findIndex((account) => account.id === id);
    this.accounts = this.accounts.filter((account) => account.id !== id);
    if (wasActive) this.activeAccountId = this.accounts[Math.min(index, this.accounts.length - 1)]?.id || "";
    await this._persistAccounts();
    if (wasActive) {
      this._activateAccount(this._activeAccount());
      if (this.activeAccountId) await this._refreshTasks();
      else await this._sendMissingConfig();
    }
    return { success: true };
  }

  async setActiveAccount(id) {
    const account = this.accounts.find((item) => item.id === id);
    if (!account || id === this.activeAccountId) return { success: !!account };
    this.activeAccountId = id;
    await this._persistAccounts();
    this._activateAccount(account);
    await this._refreshTasks();
    return { success: true };
  }

  async initializeBadge() {
    await this._refreshTasks();
  }

  async createDownloadTask(url, resolver) {
    if (this.api.isMissingConfig) {
      return await chrome.runtime.openOptionsPage();
    }

    const response = await this.api.createTask(url, null, resolver);

    if (response.success) {
      await chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon256-success.png",
        title: chrome.i18n.getMessage("taskAdded"),
        message: url,
      });
      await this._refreshTasks();
    } else {
      await chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon256-error.png",
        title: chrome.i18n.getMessage("failedToAddTask"),
        message: response.message || url,
      });
    }
  }

  updateSettings(settings) {
    return this.api.setSettings(settings);
  }

  loadSettings(settings) {
    this.accounts = Array.isArray(settings.accounts) ? settings.accounts : [];
    this.activeAccountId = this.accounts.some((item) => item.id === settings.activeAccountId)
      ? settings.activeAccountId
      : this.accounts[0]?.id || "";
    this._activateAccount(this._activeAccount());
  }

  _activeAccount() {
    return this.accounts.find((item) => item.id === this.activeAccountId);
  }

  _activateAccount(account) {
    this._accountGeneration++;
    this._locked = {};
    this._tasks = [];
    this._updatedAt = 0;
    this._tasksFetchPromise = null;
    this.api.setSettings(account || { host: "", account: "", passwd: "", sid: "" });
  }

  async _persistAccounts() {
    await chrome.storage.local.set({ accounts: this.accounts, activeAccountId: this.activeAccountId });
  }

  async saveActiveSid(sid) {
    const account = this._activeAccount();
    if (!account) return;
    account.sid = sid;
    await this._persistAccounts();
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

  async _fetchTasks(generation) {
    const response = await this.api.getTasks("transfer");
    if (generation !== this._accountGeneration) return false;

    const ok = await this._checkApiResponse(response);

    if (response.success) {
      this._tasks = response.data.tasks;
      this._updatedAt = Math.floor(Date.now() / 1000);
    }

    return ok;
  }

  async _refreshTasks() {
    if (this._tasksFetchPromise === null) {
      const generation = this._accountGeneration;
      const promise = (async () => {
        const ok = await this._fetchTasks(generation);
        if (ok) await this._sendTasks();
        return ok;
      })();
      this._tasksFetchPromise = promise;
      try {
        return await promise;
      } finally {
        if (this._tasksFetchPromise === promise) this._tasksFetchPromise = null;
      }
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

let servicePromise = null;

/**
 * @returns {Promise<BackgroundService>}
 */
export async function useService() {
  if (!servicePromise) {
    servicePromise = (async () => {
      const api = new Api();
      const service = new BackgroundService(api);
      api.onSidChange((sid) => service.saveActiveSid(sid));

      const settings = await chrome.storage.local.get();
      service.loadSettings(settings || {});
      return service;
    })();
  }
  return servicePromise;
}
