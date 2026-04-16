import { applyI18n } from "./lib/i18n.js";
import {humanSpeed, TaskList} from './lib/tasks.js';
import { useState } from "./lib/popup-state.js";

let refreshTimer = 0;

const $el = (id) => document.getElementById(id);

const $class = (id, className, useCriteria) => {
  if (useCriteria) $el(id).classList.add(className);
  else $el(id).classList.remove(className);
};

const $text = (id, text) => {
  $el(id).textContent = text;
}

applyI18n();

const taskList = new TaskList($el('downloadsList'), $el('downloadTemplate'));
let state = await useState()

taskList.onEvent(handleTaskAction);
state.onChange(handleStateChanges)

handleStateChanges(state.get())

$el('clearAllBtn').addEventListener("click", handleClearAllClick);
$el('openDsmBtn').addEventListener("click", handleOpenDsmClick);
$el('openSettingsBtn').addEventListener("click", handleOpenSettingsClick);

async function handleTaskAction(action, id) {
  clearTimeout(refreshTimer);
  await chrome.runtime.sendMessage({ action, data: { id } });
  await refreshTasks();
}

async function handleClearAllClick(e) {
  e.preventDefault();
  if (!state.hasFinishedTasks) {
    return;
  }

  const ids = taskList.getFinishedTaskIds()

  if (ids.length > 0) {
    clearTimeout(refreshTimer);
    await chrome.runtime.sendMessage({action: "delete", data: {id: ids.join(",")}});
    await refreshTasks();
  }
}

async function handleOpenDsmClick(e) {
  e.preventDefault();
  if (state.host) {
    await chrome.tabs.create({
      url: `${state.host}/index.cgi?launchApp=SYNO.SDS.DownloadStation.Application`,
      active: true,
    });
  } else {
    await chrome.runtime.openOptionsPage();
  }
}

async function handleOpenSettingsClick(e) {
  e.preventDefault();
  await chrome.runtime.openOptionsPage();
}

function handleNoActiveTacksVisibility() {
  const visible = state.isLoggedIn && !state.hasTasks
  $class('noActiveTasks', 'd-none', !visible)
}

async function refreshTasks() {
  clearTimeout(refreshTimer);

  const response = await chrome.runtime.sendMessage({ action: "tasks" });
  state.set({error: response.success ? "" : response.success || "ERROR"});

  if (response.success) {
    const totals = taskList.render(response.data.tasks);
    state.set(totals);
    $text('lastUpdateTime', new Date().toLocaleTimeString());
    refreshTimer = setTimeout(refreshTasks, 5000);
  } else {
    refreshTimer = setTimeout(refreshTasks, 10000);
  }
}

function handleStateChanges(changes) {
  Object.keys(changes).forEach((key) => {
    const value = changes[key];
    switch (key) {

      case "hasFinishedTasks":
        $class('clearAllBtn', 'disabled', !value);
        break;

      case "speedDownload":
        $text('totalDownloadSpeed', humanSpeed(value));
        break;

      case "speedUpload":
        $text('totalUploadSpeed', humanSpeed(value));
        break;

      case "hasTasks":
        handleNoActiveTacksVisibility()
        break;

      case "isLoggedIn":
        handleNoActiveTacksVisibility()
        if (value) refreshTasks().then(() => {});
        else clearTimeout(refreshTimer);
        break;

      case "hasAccountData":
        $class('configRequired', 'd-none', value)
        $class('footer', 'd-none', !value)
        break;

      case 'error':
        $text('errorLine', value);
        $class('errorLine', 'd-none', !value)
        break;
    }
  })
}
