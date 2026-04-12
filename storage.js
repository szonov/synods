// storage.js - chrome.storage.local helpers

const STORAGE_KEYS = {
  HOST: 'synology_host',
  USERNAME: 'synology_username',
  PASSWORD: 'synology_password',
  SESSION_ID: 'session_id',
  LANGUAGE: 'language'
};

async function saveSetting(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

async function getSetting(key, defaultValue = '') {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || defaultValue);
    });
  });
}

async function getAllSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([
      STORAGE_KEYS.HOST,
      STORAGE_KEYS.USERNAME,
      STORAGE_KEYS.PASSWORD,
      STORAGE_KEYS.LANGUAGE
    ], resolve);
  });
}

async function clearSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.remove([
      STORAGE_KEYS.HOST,
      STORAGE_KEYS.USERNAME,
      STORAGE_KEYS.PASSWORD,
      STORAGE_KEYS.SESSION_ID
    ], resolve);
  });
}