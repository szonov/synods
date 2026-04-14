import {applyI18n, getMessage as __} from './lib/i18n.js';
import * as STORAGE from './lib/storage.js';
import { DownloadsList } from "./lib/downloads-list.js";
import { mockTaskListResponse1, mockTaskListResponse2 } from "./lib/mock-api-responses.js";

const taskList = new DownloadsList(
  document.getElementById("downloadsList"),
  document.getElementById("downloadTemplate"),
);

taskList.onEvent((event, id) => {
  console.log(`taskList.onEvent: ${event} / ${id}`);

  if (event === "pause" && id === "dbid_230") {
    taskList.render(mockTaskListResponse2.data.tasks);
    document.getElementById('lastUpdateTime').textContent =
      `${__('lastUpdate')}: ${(new Date).toLocaleTimeString()}`;
  }
});

taskList.render(mockTaskListResponse1.data.tasks);


// taskList.render([demoResponse.data.tasks[0]]);
// taskList.render([]);

document.getElementById('totalDownloadSpeed').textContent = taskList.humanSpeedDownload
document.getElementById('totalUploadSpeed').textContent = taskList.humanSpeedUpload
document.getElementById('lastUpdateTime').textContent =
    `${__('lastUpdate')}: ${(new Date).toLocaleTimeString()}`;

let currentDownloads = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Применяем переводы через chrome.i18n
  applyI18n();

  // Load settings and fetch downloads
  // await loadDownloads();

  // Setup event listeners
  document.getElementById('openDsmLink').addEventListener('click', openDsm);
  document.getElementById('openSettingsLink').addEventListener('click', openSettings);
  document.getElementById('clearAll').addEventListener('click', clearAll);
});

async function pauseDownload(id) {
  // TODO: Call Synology API to pause download
  console.log('Pause download:', id);
}

async function resumeDownload(id) {
  // TODO: Call Synology API to resume download
  console.log('Resume download:', id);
}

async function removeDownload(id) {
  // TODO: Call Synology API to remove download
  console.log('Remove download:', id);
}

async function openDsm() {
  const {host} = await STORAGE.get();

  if (host)
  {
    await chrome.tabs.create({
      url: `${host}/index.cgi?launchApp=SYNO.SDS.DownloadStation.Application`,
      active: true,
    });
  }
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}

function clearAll() {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "./icons/icon128.png",
      title: "Not implemented",
      message: "Check it later",
    });
}
