import { applyI18n } from "./lib/i18n.js";
import Status from "./lib/settings-status.js";
import {sendMessage} from "./lib/shared.js";

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

const settings = await sendMessage("get-settings")

$host.value = settings.host;
$username.value = settings.account;
$password.value = settings.passwd;

async function saveSettings(e) {
  e.preventDefault();

  const settings = {
    host: $host.value.trim(),
    account: $username.value.trim(),
    passwd: $password.value,
  };

  if (!validateInput(settings)) {
    return;
  }

  status.neutral(chrome.i18n.getMessage("settingsSaving"), 10000);

  disableForm(true);
  const response = await sendMessage("login", settings);
  disableForm(false);

  if (response.success) status.success(response.message);
  else status.error(response.message);
}

async function clearSettings(e) {
  e.preventDefault();

  if (!confirm(chrome.i18n.getMessage("clearSettingsConfirm"))) {
    return;
  }

  await chrome.runtime.sendMessage({ action: "logout" });

  $host.value = "";
  $username.value = "";
  $password.value = "";

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
