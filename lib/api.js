import DownloadURL from "./download-url.js";

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

/**
 * Generate error response from api calls
 *
 * @param {string} message
 * @param {Object} more
 * @returns {{success: boolean, message: *}}
 */
function errorResponse(message, more = {}) {
  return { success: false, message, ...more };
}

/**
 * Generate success response from api calls
 *
 * @param {string} message
 * @param {Object} more
 * @returns {{success: boolean, message: string}}
 */
function successResponse(message = "", more = {}) {
  return { success: true, message, ...more };
}

/**
 * Makes HTTP POST calls which always return success/error json without exceptions
 *
 * @param {string|RequestInfo|URL} url
 * @param {RequestInit} init
 * @returns {Promise<{success}|any|{success: boolean, message: *}>}
 */
async function post(url, init) {
  const options = {
    signal: AbortSignal.timeout(10000), // 10 sec
    method: "POST",
    ...init,
  };
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      return errorResponse(`HTTP Error: (${response.status}) ${response.statusText}`);
    }

    const json = await response.json();

    if (!json.success) {
      const code = json.error?.code ?? 0;
      return errorResponse(`API Error: (${code}) ${API_ERRORS[code] ?? API_ERRORS[0]}`, json);
    }

    return json;
  } catch (err) {
    return errorResponse(`${err.name}: ${err.message}`);
  }
}

class SynologyApi {
  constructor() {
    this.host = "";
    this.account = "";
    this.passwd = "";
    this.sid = "";
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
    return this.sid !== "";
  }

  get hasAccountData() {
    return this.host !== "" && this.account !== "" && this.passwd !== "";
  }

  async _setSid(sid) {
    // apply the `sid` setting to our instance immediately,
    // without waiting for the storage change event to fire.
    this.sid = sid;
    await chrome.storage.local.set({ sid });
  }

  async login() {
    if (!this.hasAccountData) return errorResponse("Synology credentials are not set.");

    const response = await post(this.authApiUrl, {
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
      return successResponse(chrome.i18n.getMessage("loginSuccess"));
    }

    await this._setSid("");
    return response;
  }

  async _withRelogin(fetchFn) {
    let loginDone = false;

    if (!this.isLoggedIn) {
      const loginResponse = await this.login();
      if (!loginResponse.success) {
        return loginResponse;
      }
      loginDone = true;
    }

    const fetchResponse = fetchFn();

    // may be expired session?
    if (!loginDone && !fetchResponse.success && [105, 400].includes(fetchResponse.error?.code)) {
      const loginResponse = await this.login();
      if (!loginResponse.success) {
        return fetchResponse;
      }
      return fetchFn();
    }

    return fetchResponse;
  }

  async _callTaskApi(method, data) {
    return this._withRelogin(async () => {
      return await post(this.taskApiUrl, {
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

  async getTasksCount() {
    const response = await this._callTaskApi("list"); // a slightly reduced list
    return response.success ? response.data.total : -1;
  }

  async pauseTask(id) {
    return await this._callTaskApi("pause", { id });
  }

  async resumeTask(id) {
    return await this._callTaskApi("resume", { id });
  }

  async deleteTask(id) {
    return await this._callTaskApi("delete", { id });
  }

  async createTask(downloadUrl) {
    const dl = new DownloadURL(downloadUrl);
    await dl.resolve();

    switch (dl.type) {
      case "direct-download":
        return await this.createUriTask(dl.url);

      case "metadata-file":
        return await this.createFileTask(dl.content, dl.filename);

      default:
        return errorResponse("Unexpected resolved url type", { type: dl.type, url: dl.url });
    }
  }

  async createUriTask(uri) {
    return await this._callTaskApi("create", { uri: new URL(uri.replace(/,/g, "%2C")) });
  }

  async createFileTask(blob, filename) {
    const body = new FormData();

    body.append("api", "SYNO.DownloadStation2.Task");
    body.append("method", "create");
    body.append("version", "2");
    body.append("type", `"file"`);
    body.append("file", `["torrent"]`);
    body.append("destination", `""`);
    body.append("create_list", "false");
    body.append("torrent", blob, filename);

    return this._withRelogin(async () => {
      return await post(`${this.task2ApiUrl}?_sid=${this.sid}`, { body });
    });
  }
}

const api = new SynologyApi();
let isLoaded = false;

chrome.storage.onChanged.addListener((changes) => {
  for (const key in changes) {
    if (["host", "account", "passwd", "sid"].includes(key)) {
      api[key] = changes[key].newValue ?? "";
    }
  }
});

export async function useApi() {
  if (!isLoaded) {
    const settings = await chrome.storage.local.get({
      host: "",
      account: "",
      passwd: "",
      sid: "",
    });

    for (const key in settings) {
      if (["host", "account", "passwd", "sid"].includes(key)) {
        api[key] = settings[key];
      }
    }

    isLoaded = true;
  }

  return api;
}
