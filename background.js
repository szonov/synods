import { useApi } from "./lib/api.js";
import IconBadge from "./lib/badge.js";

const badge = new IconBadge();

// Events are triggered when the browser is launched.
chrome.runtime.onStartup.addListener(() => {
  badge.autodetect();
});

// Events are triggered when an extension is installed for the first time or updated.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToSynology",
    title: chrome.i18n.getMessage("contextMenuAdd"),
    contexts: ["link", "audio", "video", "image"],
  });
  badge.autodetect();
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

  useApi().then(async (api) => {
    if (!api.hasAccountData) {
      await chrome.runtime.openOptionsPage();
      return;
    }

    const response = await api.createTask(downloadUrl);

    if (response.success) {
      badge.increment();
      await chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon256-success.png",
        title: chrome.i18n.getMessage("taskAdded"),
        message: downloadUrl,
      });
    } else {
      await chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon256-error.png",
        title: chrome.i18n.getMessage("failedToAddTask"),
        message: response.error || downloadUrl,
      });
    }
  });
});

// handle messages from popup or settings pages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case "reset":
      badge.reset();
      break;

    case "login":
      useApi()
        .then((api) => api.login())
        .then((response) => {
          sendResponse(response);
          if (response.success) badge.loadFromApi();
          else badge.setErrorState();
        });
      break;

    case "tasks":
      useApi()
        .then((api) => api.getTasks())
        .then((response) => {
          sendResponse(response);
          if (response.success) badge.update(response.data.total);
          else badge.setErrorState();
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
