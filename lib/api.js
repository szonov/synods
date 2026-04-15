import * as STORAGE from './storage.js';

const API_ERRORS = {
  // --- Default error
  0: 'Unknown error',

  // --- General errors (100-107)
  100: 'Unknown error.',
  101: 'Invalid parameters.',
  102: 'API does not exist.',
  103: 'Method does not exist.',
  104: 'Version not supported.',
  105: 'Insufficient privilege.',
  106: 'Session time out.',
  107: 'Session interrupted.',

  // --- Auth errors (400-408)
  400: 'Incorrect account or password.',
  401: 'Guest account disabled.',
  402: 'Account disabled.',
  403: 'Invalid password.',
  404: 'Permission denied.',
  405: '2-step verification needed.',
  406: '2-step verification failed.',
  407: 'App portal: permission denied.',

  // --- Download Station errors (400-500+)
  408: 'Invalid task ID.',
  409: 'Invalid task action.',
  410: 'No default destination folder.',

  // --- Download Station tasks errors (createTask)
  501: 'Max number of tasks reached.',
  502: 'Destination denied.',
  503: 'Destination is not a directory.',
  504: 'Destination does not exist.',
  505: 'Invalid download link.',
  506: 'Invalid File Hosting information.',
  507: 'File already exists.',
};

const authApiUrl = (host) => {
  return `${host}/webapi/auth.cgi`;
}

const taskApiUrl = (host) => {
  return `${host}/webapi/DownloadStation/task.cgi`;
}

class Request {
  constructor(url, params) {
    this.url = url;
    this.params = params;
  }

  withUrl(newUrl) {
    this.url = newUrl;
    return this
  }

  with(paramName, paramValue) {
    this.params[paramName] = paramValue;
    return this
  }

  _params(reqType) {
    switch (reqType)
    {
      case 'POST':
        return {
          input: this.url,
          init: {
            signal: AbortSignal.timeout(10000), // 10 sec
            credentials: "include",
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(this.params),
          },
        };
      // TODO: UPLOAD
      default:// default is 'GET'
        return {
          input: `${this.url}?${new URLSearchParams(this.params)}`,
          init: {
            signal: AbortSignal.timeout(10000), // 10 sec
            credentials: "include",
          },
        };
    }
  }

  async _req(reqType = 'GET') {
    try
    {
      const {input, init} = this._params(reqType);
      const response = await fetch(input, init);
      if (!response.ok)
      {
        return {
          success: false,
          message: `HTTP Error: (${response.status}) ${response.statusText}`
        };
      }

      const json = await response.json() || {success: false, error: {code: 0}};

      if (!json.success)
      {
        const code = json.error?.code ?? 0;
        return {
          success: false,
          message: `API Error: (${code}) ${API_ERRORS[code] ?? API_ERRORS[0]}`,
          ...json,
        };
      }
      return json;
    }
    catch (err)
    {
      return {
        success: false,
        message: `${err.name}: ${err.message}`};
    }
  }

  async post() {
    return await this._req('POST')
  }

  async get() {
    return await this._req('GET')
  }

  async upload() {
    return await this._req('UPLOAD')
  }
}

function authApiRequest(host, params) {
  return new Request(authApiUrl(host), {
    api: 'SYNO.API.Auth', version: 3, ...params,
  })
}

function taskApiRequest(host, params) {
  return new Request(taskApiUrl(host), {
    api: 'SYNO.DownloadStation.Task', version: 3, ...params,
  })
}

export async function login() {

  const {host, account, passwd} = await STORAGE.get();

  if (host === '' || account === '' || passwd === '')
  {
    return {success: false, message: 'Synology credentials are not set.'};
  }

  await STORAGE.set({sid: ''});

  const response = await authApiRequest(host, {
    method: 'login', account, passwd, session: 'DownloadStation', format: 'sid',
  }).post();

  if (response.success)
  {
    await STORAGE.set({sid: response.data.sid});
    return {success: true, message: chrome.i18n.getMessage('loginSuccess')};
  }
  return response;
}

export async function getTasks() {
  return callTaskAPI('list', {additional: 'transfer'});
}

export async function addTask(url) {
  // TODO: Add download task by URL
}

export async function pauseTask(...id) {
  return (id.length > 0)
    ? callTaskAPI('pause', {id: id.join(",")})
    : {success: true, data: []};
}

export async function resumeTask(...id) {
  return (id.length > 0)
    ? callTaskAPI('resume', {id: id.join(",")})
    : {success: true, data: []};
}

export async function deleteTask(...id) {
  return (id.length > 0)
    ? callTaskAPI('delete', {id: id.join(",")})
    : {success: true, data: []};
}


async function callTaskAPI(method, params) {

  const {host, sid} = await STORAGE.get();
  if (sid === '') {
    return {success: false, message: 'Auth required.'};
  }

  const req =  taskApiRequest(host, {_sid: sid, method, ...params});
  const response = await req.post()

  // may be expired session?
  if (!response.success && [105, 400].includes(response.error?.code))
  {
    // re-login
    const res = await login();

    if (!res.success) {
      // re-login failed, returns original response with error
      return response
    }

    // get updated data from storage, at least sid was updated during login,
    // but host also possible updated on settings page (unlikely...)
    const {host, sid} = await STORAGE.get();

    // fix original request and repeat it
    return await req.withUrl(taskApiUrl(host)).with('_sid', sid).post()
  }

  return response;
}
