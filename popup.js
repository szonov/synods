import {applyI18n} from './lib/i18n.js'

let currentDownloads = [];
let lastUpdate = null;

document.addEventListener('DOMContentLoaded', async () => {
  applyI18n();

  // Load settings and fetch downloads
  await loadDownloads();

  // Setup event listeners
  document.getElementById('openDsmLink').addEventListener('click', openDsm);
  document.getElementById('openSettingsLink').addEventListener('click', openSettings);
  document.getElementById('clearAllBtn').addEventListener('click', clearAllDownloads);
});

async function loadDownloads() {
  const updateTime = new Date();
  document.getElementById('lastUpdateTime').textContent =
      `${chrome.i18n.getMessage('lastUpdate')}: ${updateTime.toLocaleTimeString()}`;

  // TODO: Fetch downloads from Synology API
  // TODO: Render downloads list
}

function renderDownloadsList(downloads) {
  const container = document.getElementById('downloadsList');
  if (!downloads || downloads.length === 0) {
    container.innerHTML = `<div class="empty">${chrome.i18n.getMessage('noDownloads')}</div>`;
    return;
  }

  // TODO: Render each download with buttons
}

function openDsm() {
  // TODO: Get host from storage and open URL
}

async function openSettings() {
  await chrome.runtime.openOptionsPage();
}

function clearAllDownloads() {
  // TODO: Call API to clear completed tasks
}