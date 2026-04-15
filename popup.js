import {applyI18n} from './lib/i18n.js';
import * as STORAGE from './lib/storage.js';
import {TaskList, humanSpeed} from './lib/tasks.js';

let refreshTimer = 0;

applyI18n();

const $openSynologyBtn = document.getElementById('openDsmLink');
const $openSettingsBtn = document.getElementById('openSettingsLink');
const $clearAllBtn = document.getElementById('clearAll');

const $totalDownloadSpeed = document.getElementById('totalDownloadSpeed')
const $totalUploadSpeed = document.getElementById('totalUploadSpeed')
const $lastUpdated = document.getElementById('lastUpdateTime')

const taskList = new TaskList(
  document.getElementById('downloadsList'),
  document.getElementById('downloadTemplate')
);

$openSynologyBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const {host} = await STORAGE.get();
  if (host)
  {
    await chrome.tabs.create({
      url: `${host}/index.cgi?launchApp=SYNO.SDS.DownloadStation.Application`,
      active: true,
    });
  }
});

$openSettingsBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  await chrome.runtime.openOptionsPage();
})

$clearAllBtn.addEventListener('click', async(e) => {
  e.preventDefault();
  clearTimeout(refreshTimer);

  // get all tasks again
  const {success, data} = await chrome.runtime.sendMessage({action: 'tasks'});

  if (success)
  {
    const totals = taskList.render(data.tasks);
    updateTotals(totals);

    const ids = data.tasks.filter(t => t.status === 'finished').map(t => t.id);
    if (ids.length > 0) {
      await chrome.runtime.sendMessage({action: 'delete', data: {id: ids}});
    }
    await refreshTasks()
  } else {
    refreshTimer = setTimeout(refreshTasks, 10000);
  }
});

taskList.onEvent(async (event, id) => {
  console.log(`taskList.onEvent: ${event} / ${id}`);

  clearTimeout(refreshTimer);
  const response = await chrome.runtime.sendMessage({action: event, data: {id}});

  console.log(response);
  await refreshTasks();
});

async function refreshTasks() {
  clearTimeout(refreshTimer);

  const response = await chrome.runtime.sendMessage({action: 'tasks'});

  console.log('refreshTasks response: ', response);

  if (response.success)
  {
    const rr = taskList.render(response.data.tasks);
    updateTotals(rr);
    refreshTimer = setTimeout(refreshTasks, 5000);
  } else {
    refreshTimer = setTimeout(refreshTasks, 10000);
  }
}

function updateTotals(r) {
  $totalDownloadSpeed.textContent = humanSpeed(r.speedDownload)
  $totalUploadSpeed.textContent = humanSpeed(r.speedUpload)
  $lastUpdated.textContent = `${chrome.i18n.getMessage('lastUpdate')}: ${(new Date).toLocaleTimeString()}`;
}

await refreshTasks();
