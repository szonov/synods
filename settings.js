import { applyI18n } from "./lib/i18n.js";
import Status from "./lib/status.js";

const $form = document.querySelector("form");
const $host = document.getElementById("host");
const $username = document.getElementById("username");
const $password = document.getElementById("password");
const $saveBtn = document.getElementById("saveBtn");
const $clearBtn = document.getElementById("clearBtn");

const status = new Status(document.getElementById("status"));

applyI18n();

$form.addEventListener("submit", saveSettings);
$clearBtn.addEventListener("click", clearSettings);

await loadSettings();

async function loadSettings() {
  const settings = await chrome.storage.local.get({
    host: "",
    account: "",
    passwd: "",
  });

  $host.value = settings.host;
  $username.value = settings.account;
  $password.value = settings.passwd;
}

async function saveSettings(e) {
  e.preventDefault();

  const settings = {
    host: $host.value.trim(),
    account: $username.value.trim(),
    passwd: $password.value,
    sid: "", // important clear sid here
  };

  if (!validateInput(settings)) {
    return;
  }

  await chrome.storage.local.set(settings);

  status.neutral(chrome.i18n.getMessage("settingsSaved"), 10000);

  disableForm(true);
  const response = await chrome.runtime.sendMessage({ action: "login" });
  disableForm(false);

  if (response.success) {
    status.success(response.message);
  } else {
    status.error(response.message);
  }
}

async function clearSettings(e) {
  e.preventDefault();

  if (!confirm(chrome.i18n.getMessage("clearSettingsConfirm"))) {
    return;
  }

  await chrome.storage.local.clear();
  await loadSettings();

  status.success(chrome.i18n.getMessage("clearSettingsSuccess"));
}

function validateInput({ host, account, passwd }) {
  if (host === "" || account === "" || passwd === "") {
    status.error(chrome.i18n.getMessage("requiredAll"));
    return false;
  }

  if (!host.startsWith("http://") && !host.startsWith("https://")) {
    status.error(chrome.i18n.getMessage("invalidHost"));
    return false;
  }

  return true;
}

function disableForm(disabled = true) {
  $host.disabled = disabled;
  $username.disabled = disabled;
  $password.disabled = disabled;
  $saveBtn.disabled = disabled;
  $clearBtn.className = disabled ? "d-none" : "";
}
