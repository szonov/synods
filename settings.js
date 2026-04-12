import {applyI18n,getMessage as __} from './lib/i18n.js'
import Status from './lib/status.js'
import * as STORAGE from './lib/storage.js'

const $form = document.querySelector('form')
const $host = document.getElementById('host')
const $username = document.getElementById('username')
const $password = document.getElementById('password')
const $saveBtn = document.getElementById('saveBtn')
const $clearBtn = document.getElementById('clearBtn')

const status = new Status(document.getElementById('status'))

applyI18n();

$form.addEventListener('submit', saveSettings);
$clearBtn.addEventListener('click', clearSettings);

await loadSettings();

async function loadSettings() {
  const settings = await STORAGE.get()

  $host.value = settings.host
  $username.value = settings.account
  $password.value = settings.passwd
}

async function saveSettings(e) {
  e.preventDefault()

  const settings = {
    host: $host.value.trim(),
    account: $username.value.trim(),
    passwd: $password.value,
    sid: "" // important clear sid here
  }

  if (!validateInput(settings)) {
    return
  }

  await STORAGE.set(settings);

  status.neutral(__('settingsSaved'), 10000)

  disableForm(true)
  const response = await chrome.runtime.sendMessage({action: "login"});
  disableForm(false)

  if (response.success) {
    status.success(response.message)
  } else {
    status.error(response.message)
  }
}

async function clearSettings(e) {
  e.preventDefault()

  if (!confirm(__('clearSettingsConfirm'))) {
    return
  }

  await STORAGE.clear();
  await loadSettings();

  status.success(__('clearSettingsSuccess'))
}

function validateInput({host,account,passwd}) {

  if (host === "" || account === "" || passwd === "") {
    status.error(__('requiredAll'))
    return false
  }

  if (!host.startsWith("http://") && !host.startsWith("https://")) {
    status.error(__('invalidHost'))
    return false
  }

  return true;
}

function disableForm(disabled = true) {
  $host.disabled = disabled
  $username.disabled = disabled
  $password.disabled = disabled
  $saveBtn.disabled = disabled
  $clearBtn.className = disabled ? 'd-none' : ''
}

