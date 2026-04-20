/**
 * @import {FailedApiResponse, ApiResponsePromise, ApiSettings} from './types.d.ts';
 *
 * @callback AsyncFetchFn
 * @returns {ApiResponsePromise}
 *
 * @callback SidChangeCallback
 * @param {string} sid
 * @returns {Promise<void>}
 */

import { post } from "./post.js";
import { resolveUrl } from "./url_resolver.js";

/**
 * Class for communication with Synology Download Station API.
 *
 * @property {string} host Synology dms base url (ex. https://syn.example.com:5001)
 * @property {string} account Username
 * @property {string} passwd Password
 * @property {string} sid Session ID
 * @property {SidChangeCallback} sidCallback Async callback called when the sid changes during login.
 */
export class Api {
  /**
   *
   * @param {ApiSettings} settings
   */
  constructor(settings = {}) {
    this.host = settings.host || "";
    this.account = settings.account || "";
    this.passwd = settings.passwd || "";
    this.sid = settings.sid || "";
    this.sidCallback = async (sid) => {};
  }

  get authApiUrl() {
    return `${this.host}/webapi/auth.cgi`;
  }

  get taskApiUrl() {
    return `${this.host}/webapi/DownloadStation/task.cgi`;
  }

  get task2ApiUrl() {
    return `${this.host}/webapi/entry.cgi`;
  }

  get isLoggedIn() {
    return !this.isMissingConfig && this.sid !== "";
  }

  get isMissingConfig() {
    return this.host === "" || this.account === "" || this.passwd === "";
  }

  /**
   * Sets new config settings and returns previous
   *
   * @param {ApiSettings} settings
   * @retruns {ApiSettings}
   */
  setSettings(settings = {}) {
    const oldSettings = {
      host: this.host,
      account: this.account,
      passwd: this.passwd,
      sid: this.sid,
    };
    for (const name in settings) {
      if (["host", "account", "passwd", "sid"].includes(name)) {
        this[name] = settings[name];
      }
    }
    return oldSettings;
  }

  /**
   * Sets a callback that is called when the sid changes during login.
   *
   * @param {SidChangeCallback} callback
   * @retruns {void}
   */
  onSidChange(callback) {
    this.sidCallback = callback;
  }

  /**
   * @param {AbortSignal?} signal
   * @returns {ApiResponsePromise}
   */
  async login(signal = null) {
    if (this.isMissingConfig) {
      return this._error("missing-config", "Account details are not set");
    }

    const response = await post(this.authApiUrl, {
      signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        api: "SYNO.API.Auth",
        version: 3,
        method: "login",
        account: this.account,
        passwd: this.passwd,
        session: "DownloadStation",
        format: "sid",
      }),
    });

    const currentSid = this.sid;
    const newSid = response.success ? response.data.sid : "";

    this.sid = newSid;

    if (currentSid !== newSid) await this.sidCallback(newSid);

    return response;
  }

  /**
   * @param {string} additional Additional info, separated by "," (detail,transfer,file,tracker,peer)
   * @param {AbortSignal?} signal
   * @returns {ApiResponsePromise}
   */
  async getTasks(additional = "", signal = null) {
    return this._taskApi("list", {additional}, signal);
  }

  /**
   * @param {string} id Task IDs, separated by ","
   * @param {string} additional Additional info, separated by "," (detail,transfer,file,tracker,peer)
   * @param {AbortSignal?} signal
   * @returns {ApiResponsePromise}
   */
  async getTask(id, additional = "", signal = null) {
    return this._taskApi("getinfo", {id, additional}, signal);
  }

  /**
   * @param {string} id Task IDs, separated by ","
   * @param {AbortSignal?} signal
   * @returns {ApiResponsePromise}
   */
  async pauseTask(id, signal = null) {
    return this._taskApi("pause", {id}, signal);
  }

  /**
   * @param {string} id Task IDs, separated by ","
   * @param {AbortSignal?} signal
   * @returns {ApiResponsePromise}
   */
  async resumeTask(id, signal = null) {
    return this._taskApi("resume", {id}, signal);
  }

  /**
   * @param {string} id Task IDs, separated by ","
   * @param {AbortSignal?} signal
   * @returns {ApiResponsePromise}
   */
  async deleteTask(id, signal = null) {
    return this._taskApi("delete", {id}, signal);
  }

  /**
   * @param {string} downloadUrl
   * @param {AbortSignal?} signal
   * @returns {ApiResponsePromise}
   */
  async createTask(downloadUrl, signal = null) {
    const dl = await resolveUrl(downloadUrl);

    switch (dl.type) {
      case "direct-download":
        return this.createUriTask(dl.url, signal);

      case "metadata-file":
        return this.createFileTask(dl.content, dl.filename, signal);

      default:
        return this._error("unknown", `Unexpected resolved url type '${dl.type}' for '${dl.url}'`);
    }
  }

  /**
   * @param {string} uri
   * @param {AbortSignal?} signal
   * @returns {ApiResponsePromise}
   */
  async createUriTask(uri, signal = null) {
    return this._taskApi("create", {uri: new URL(uri.replace(/,/g, "%2C"))}, signal);
  }

  /**
   * @param {Blob} content
   * @param {string} filename
   * @param {AbortSignal?} signal
   * @returns {ApiResponsePromise}
   */
  async createFileTask(content, filename, signal = null) {
    const body = new FormData();

    body.append("api", "SYNO.DownloadStation2.Task");
    body.append("method", "create");
    body.append("version", "2");
    body.append("type", `"file"`);
    body.append("file", `["torrent"]`);
    body.append("destination", `""`);
    body.append("create_list", "false");
    body.append("torrent", content, filename);

    const fetchFn = () => post(`${this.task2ApiUrl}?_sid=${this.sid}`, { signal, body });

    return this._fetch(fetchFn, signal);
  }

  /**
   * Generate error response
   *
   * @param {"missing-config" | "unknown"} type
   * @param {string} message
   * @returns {FailedApiResponse}
   */
  _error(type, message) {
    return { success: false, type, message };
  }

  /**
   * Fetching response with relogin (if needed)
   *
   * @param {AsyncFetchFn} fetchFn
   * @param {AbortSignal?} signal
   * @returns {ApiResponsePromise}
   */
  async _fetch(fetchFn, signal) {
    if (this.isMissingConfig) {
      return this._error("missing-config", "Account details are not set");
    }

    let loginDone = false;

    if (!this.isLoggedIn) {
      const loginResponse = await this.login(signal);
      if (!loginResponse.success) {
        return loginResponse;
      }
      loginDone = true;
    }

    const response = await fetchFn();

    // may be expired session?
    if (!loginDone && !response.success && [105, 119, 400].includes(response.error?.code)) {
      const loginResponse = await this.login(signal);
      if (!loginResponse.success) {
        return loginResponse;
      }

      return await fetchFn();
    }

    return response;
  }

  /**
   * Call SYNO.DownloadStation.Task api method
   *
   * @param {string} method
   * @param {{*}} data
   * @param {AbortSignal?} signal
   * @returns {ApiResponsePromise}
   */
  async _taskApi(method, data, signal) {
    const fetchFn = () =>
      post(this.taskApiUrl, {
        signal,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          api: "SYNO.DownloadStation.Task",
          version: 3,
          method,
          _sid: this.sid,
          ...data,
        }),
      });

    return this._fetch(fetchFn, signal);
  }
}
