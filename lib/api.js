import * as STORAGE from './storage.js';

const API_PATH_AUTH = '/webapi/auth.cgi';
const API_PATH_DS = '/webapi/DownloadStation/task.cgi';

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

export async function login() {

  const {host, account, passwd} = await STORAGE.get();

  if (host === '' || account === '' || passwd === '')
  {
    return {success: false, message: 'Synology credentials are not set.'};
  }

  await STORAGE.set({sid: ''});

  const response = await _post(`${host}${API_PATH_AUTH}`, {
    api: 'SYNO.API.Auth', version: 3, method: 'login',
    account, passwd,
    session: 'DownloadStation', format: 'sid',
  });

  if (response.success) {
    await STORAGE.set({sid: response.data.sid});
    return {success: true, message: chrome.i18n.getMessage("loginSuccess")};
  }
  return response;
}

export async function getTasks() {
  // TODO: Get list of download tasks
  // GET /webapi/DownloadStation/task.cgi?api=SYNO.DownloadStation.Task&version=1&method=list
}

export async function addTask(url) {
  // TODO: Add download task by URL
}

export async function pauseTask(id) {
  // TODO: Pause download task
}

export async function resumeTask(id) {
  // TODO: Resume download task
}

export async function deleteTask(id) {
  // TODO: Delete download task
}

export async function clearAllTasks() {
  // TODO: Delete all completed tasks
}

// helpers

async function _post(url, params) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try
  {
    const response = await fetch(url, {
      signal: controller.signal,
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    });

    if (!response.ok)
    {
      return {
        success: false,
        message: `HTTP Error: (${response.status}) ${response.statusText}`,
      };
    }

    const json = await response.json();

    if (!json.success)
    {
      const code = json.error?.code ?? 0;
      return {
        success: false,
        message: `API Error: (${code}) ${API_ERRORS[code] ?? API_ERRORS[0]}`,
      };
    }

    return json;
  }
  catch (err)
  {
    return {
      success: false,
      message: err.name === 'AbortError' ? 'Timeout' : `Network: ${err.message}`,
    };
  }
  finally
  {
    clearTimeout(timer);
  }
}
