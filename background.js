import { useApi } from "./lib/api.js";

// Events are triggered when the browser is launched.
chrome.runtime.onStartup.addListener(() => {
  setInitialBadge();
});

// Events are triggered when an extension is installed for the first time or updated.
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu
  chrome.contextMenus.create({
    id: "addToSynology",
    title: chrome.i18n.getMessage("contextMenuAdd"),
    contexts: ["link", "audio", "video", "image"],
  });
  setInitialBadge();
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== "addToSynology") {
    return;
  }
  const downloadUrl = info.linkUrl ?? info.srcUrl ?? "";
  if (!downloadUrl) {
    return;
  }

  console.log("Adding to Synology: ... ", downloadUrl);

  useApi().then(async (api) => {
    const response = await api.createTask(downloadUrl);
    if (response.success) {
      await chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "New download added",
        message: downloadUrl,
      });
      await updateBadge("increment");
    } else {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "ERROR: " + response.message,
        message: downloadUrl,
      });
    }
  });
});

// handle messages from popup or settings pages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case "login":
      useApi()
        .then((api) => api.login())
        .then((response) => {
          sendResponse(response);
          updateBadge(response.success ? "api" : -1);
        });
      break;

    case "tasks":
      useApi()
        .then((api) => api.getTasks())
        .then((response) => {
          sendResponse(response);
          updateBadge(response.success ? response.data.total : -1);
        });
      break;

    case "resume":
      useApi()
        .then((api) => api.resumeTask(msg.data.id))
        .then(sendResponse);
      break;

    case "pause":
      useApi()
        .then((api) => api.pauseTask(msg.data.id))
        .then(sendResponse);
      break;

    case "delete":
      useApi()
        .then((api) => api.deleteTask(msg.data.id))
        .then(sendResponse);
      break;
  }
  return true;
});

function badge(text = "", color = "#ffffff") {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

function setBadgeCount(count) {
  if (count < 0) badge("!", "#C43B38");
  else if (count > 0) badge(String(count), "#0d8050");
  else badge();
}

/**
 * Set correct number or text to badge
 * Possible values:
 *  'api': counter should be loaded from api
 *  'increment': counter should be incremented by one
 *  -1: errored counter
 *  0+: exact counter value
 *
 * @param {number|string} value
 * @returns {Promise<{success: boolean}>}
 */
function updateBadge(value) {
  if (value === "increment") {
    chrome.action.getBadgeText({}, (result) => {
      const c = parseInt(result);
      setBadgeCount(isNaN(c) ? 1 : c + 1);
    });
  } else if (value === "api") {
    useApi()
      .then((api) => api.getTasksCount())
      .then((count) => setBadgeCount(count));
  } else {
    setBadgeCount(value);
  }
}

function setInitialBadge() {
  useApi().then((api) => {
    if (api.isLoggedIn) updateBadge("api");
    else if (api.hasAccountData) updateBadge(-1);
    else updateBadge(0);
  });
}
