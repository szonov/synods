export async function clear() {
  await chrome.storage.local.clear();
}

export async function get() {
  return await chrome.storage.local.get({
    host: "",
    account: "",
    passwd: "",
    sid: "",
  });
}

export async function set(settings) {
  await chrome.storage.local.set(settings);
}
