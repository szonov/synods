import { applyI18n } from "./lib/i18n.js";
import { sendMessage } from "./lib/shared.js";
import { humanSpeed, TaskList } from "./lib/tasks.js";

const REFRESH_INTERVAL = 5000;
let refreshTimer = 0;

const refresh = async () => await sendMessage("new-tasks");

const scheduleRefresh = () => {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refresh, REFRESH_INTERVAL);
};

const $el = (id) => document.getElementById(id);

const $class = (id, className, useCriteria) => {
  if (useCriteria) $el(id).classList.add(className);
  else $el(id).classList.remove(className);
};

const $text = (id, text) => {
  $el(id).textContent = text;
};

applyI18n();

const taskList = new TaskList($el("downloadsList"), $el("downloadTemplate"));
taskList.onEvent(handleTaskAction);

$el("openDsmBtn").addEventListener("click", handleOpenDsmClick);
$el("openSettingsBtn").addEventListener("click", handleOpenSettingsClick);
//
async function handleTaskAction(action, id) {
  await sendMessage(action, { id });
}

async function handleOpenDsmClick(e) {
  e.preventDefault();
  const host = await sendMessage("get-host");
  if (host) {
    await chrome.tabs.create({
      url: `${host}/index.cgi?launchApp=SYNO.SDS.DownloadStation.Application`,
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

const noAccount = function (show = true) {
  $class("configRequired", "d-none", !show);
  $class("footer", "d-none", show);
};
const hideLoader = function (hide = true) {
  $class("loader", "d-none", hide);
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const action = msg.action;
  const data = msg.data || {};
  // console.log(`[popup] Received message [${action}]`, data);

  let hideNoAccountDiv = true;
  switch (action) {
    case "lock-task":
      taskList.lock(data.id);
      break;

    case "unlock-task":
      taskList.unlock(data.id);
      break;

    case "missing-config":
      clearTimeout(refreshTimer);
      hideLoader();

      taskList.render([]);
      $text("totalDownloadSpeed", humanSpeed(""));
      $text("totalUploadSpeed", humanSpeed(""));
      $text("lastUpdateTime", "--");
      $class("noActiveTasks", "d-none", true);
      $class("errorLine", "d-none", true);

      noAccount(true);
      return;

    case "app-error":
    case "api-error":
      $text("errorLine", data.message);
      $class("errorLine", "d-none", false);
      break;

    case "task-list":
      hideLoader();

      const totals = taskList.render(data.tasks, data.locked);

      $text("totalDownloadSpeed", humanSpeed(totals.speedDownload));
      $text("totalUploadSpeed", humanSpeed(totals.speedUpload));
      $text("lastUpdateTime", new Date(data.updatedAt * 1000).toLocaleTimeString());
      $class("noActiveTasks", "d-none", data.total);

      $class("errorLine", "d-none", true);

      scheduleRefresh();
      break;

    default:
      hideNoAccountDiv = false;
      break;
  }

  if (hideNoAccountDiv) {
    noAccount(false);
  }
});

await sendMessage("latest-tasks");
