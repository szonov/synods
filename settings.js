// settings.js

document.addEventListener('DOMContentLoaded', async () => {
  applyI18n();

  const settings = await getAllSettings();
  document.getElementById('host').value = settings[STORAGE_KEYS.HOST] || '';
  document.getElementById('username').value = settings[STORAGE_KEYS.USERNAME] || '';
  document.getElementById('password').value = settings[STORAGE_KEYS.PASSWORD] || '';
  document.getElementById('language').value = settings[STORAGE_KEYS.LANGUAGE] || 'en';

  document.getElementById('saveBtn').addEventListener('click', saveSettings);
});

async function saveSettings() {
  await saveSetting(STORAGE_KEYS.HOST, document.getElementById('host').value);
  await saveSetting(STORAGE_KEYS.USERNAME, document.getElementById('username').value);
  await saveSetting(STORAGE_KEYS.PASSWORD, document.getElementById('password').value);
  await saveSetting(STORAGE_KEYS.LANGUAGE, document.getElementById('language').value);

  const status = document.getElementById('status');
  status.textContent = chrome.i18n.getMessage('settingsSaved');
  setTimeout(() => { status.textContent = ''; }, 2000);
}