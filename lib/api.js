import * as STORAGE from "./storage.js";
import { resolveUrl } from "./url-resolver.js";

const API_ERRORS = {
  // --- Default error
  0: "Unknown error",

  // --- General errors (100-107)
  100: "Unknown error.",
  101: "Invalid parameters.",
  102: "API does not exist.",
  103: "Method does not exist.",
  104: "Version not supported.",
  105: "Insufficient privilege.",
  106: "Session time out.",
  107: "Session interrupted.",

  // --- Auth errors (400-408)
  400: "Incorrect account or password.",
  401: "Guest account disabled.",
  402: "Account disabled.",
  403: "Invalid password.",
  404: "Permission denied.",
  405: "2-step verification needed.",
  406: "2-step verification failed.",
  407: "App portal: permission denied.",

  // --- Download Station errors (400-500+)
  408: "Invalid task ID.",
  409: "Invalid task action.",
  410: "No default destination folder.",

  // --- Download Station tasks errors (createTask)
  501: "Max number of tasks reached.",
  502: "Destination denied.",
  503: "Destination is not a directory.",
  504: "Destination does not exist.",
  505: "Invalid download link.",
  506: "Invalid File Hosting information.",
  507: "File already exists.",
};

function _error(message, more = {}) {
  return { success: false, message, ...more };
}

function _success(message = "", more = {}) {
  return { success: true, message, ...more };
}

async function _fetch(url, options) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      return _error(`HTTP Error: (${response.status}) ${response.statusText}`);
    }

    const json = await response.json();

    if (!json.success) {
      const code = json.error?.code ?? 0;
      return _error(`API Error: (${code}) ${API_ERRORS[code] ?? API_ERRORS[0]}`, json);
    }

    return json;
  } catch (err) {
    return _error(`${err.name}: ${err.message}`);
  }
}

class SynologyApi {
  constructor() {
    this.host = "";
    this.account = "";
    this.passwd = "";
    this.sid = "";
    this._initialized = false;
  }

  get _authApiUrl() {
    return `${this.host}/webapi/auth.cgi`;
  }

  get _taskApiUrl() {
    return `${this.host}/webapi/DownloadStation/task.cgi`;
  }

  get _task2ApiUrl() {
    return `${this.host}/webapi/entry.cgi`;
  }

  get _isLoggedIn() {
    return this.sid !== "";
  }

  get _hasAccountData() {
    return this.host !== "" && this.account !== "" && this.passwd !== "";
  }

  async _init() {
    if (this._initialized) {
      return;
    }

    const { host, account, passwd, sid } = await STORAGE.get();
    this.host = host;
    this.account = account;
    this.passwd = passwd;
    this.sid = sid;

    this._initialized = true;
  }

  async _setSid(sid) {
    // apply the setting to our instance immediately, without waiting for the storage change event to fire.
    this.sid = sid;

    // and now notify storage
    await STORAGE.set({ sid });
  }

  applyChanges(changes) {
    for (const key in changes) {
      if (["host", "account", "passwd", "sid"].includes(key)) {
        this[key] = changes[key].newValue ?? "";
      }
    }
  }

  async login() {
    await this._init();

    if (!this._hasAccountData) {
      return { success: false, message: "Synology credentials are not set." };
    }

    const response = await _fetch(this._authApiUrl, {
      signal: AbortSignal.timeout(10000), // 10 sec
      method: "POST",
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

    if (response.success) {
      await this._setSid(response.data.sid);
      return _success(chrome.i18n.getMessage("loginSuccess"));
    }

    await this._setSid("");
    return response;
  }

  async _withRelogin(fetchFn) {
    let loginDone = false;

    if (!this._isLoggedIn) {
      const loginResponse = await this.login();
      if (!loginResponse.success) {
        return loginResponse;
      }
      loginDone = true;
    }

    const response = fetchFn();

    // may be expired session?
    if (!loginDone && !response.success && [105, 400].includes(response.error?.code)) {
      // re-login
      const loginResponse = await this.login();
      if (!loginResponse.success) {
        // re-login failed, returns original response with error
        return response;
      }

      // repeat original request after success re-login
      return fetchFn();
    }

    return response;
  }

  async _callTaskApi(method, data) {
    await this._init();

    return this._withRelogin(async () => {
      return await _fetch(this._taskApiUrl, {
        signal: AbortSignal.timeout(10000), // 10 sec
        method: "POST",
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
    });
  }

  async getTasks() {
    return await this._callTaskApi("list", { additional: "transfer" });
  }

  async pauseTask(...ids) {
    return await this._callTaskApi("pause", { id: ids.join(",") });
  }

  async resumeTask(...ids) {
    return await this._callTaskApi("resume", { id: ids.join(",") });
  }

  async deleteTask(...ids) {
    return await this._callTaskApi("delete", { id: ids.join(",") });
  }

  async createTask(downloadUrl) {
    const meta = await resolveUrl(downloadUrl);

    switch (meta.type) {
      case "direct-download":
        return await this.createUriTask(meta.url);

      case "metadata-file":
        return await this.createFileTask(meta.content, meta.filename);

      default:
        return _error("unexpected file type", { meta });
    }
  }

  async createUriTask(uri) {
    return await this._callTaskApi("create", { uri: new URL(uri.replace(/,/g, "%2C")) });
  }

  async createFileTask(blob, filename) {
    await this._init();

    const formData = new FormData();

    formData.append("api", "SYNO.DownloadStation2.Task");
    formData.append("method", "create");
    formData.append("version", "2");
    formData.append("type", `"file"`);
    formData.append("file", `["torrent"]`);
    formData.append("destination", `""`);
    formData.append("create_list", "false");
    formData.append("torrent", blob, filename);

    return this._withRelogin(async () => {
      return await _fetch(`${this._task2ApiUrl}?_sid=${this.sid}`, {
        signal: AbortSignal.timeout(10000),
        method: "POST",
        body: formData,
      });
    });
  }
}

const apiInstance = new SynologyApi();

chrome.storage.onChanged.addListener((changes) => {
  apiInstance.applyChanges(changes);
});

export default apiInstance;
