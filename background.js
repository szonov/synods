import { useService } from "./lib/background_service.js";

// Events are triggered when the browser is launched.
chrome.runtime.onStartup.addListener(() => {
  useService().then((s) => s.initializeBadge());
});

// Events are triggered when an extension is installed for the first time or updated.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToSynology",
    title: chrome.i18n.getMessage("contextMenuAdd"),
    contexts: ["link", "audio", "video", "image"],
  });
  useService().then((s) => s.initializeBadge());
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
  useService().then((s) => s.createDownloadTask(downloadUrl));
});

// handle messages from popup or settings pages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const action = msg.action;
  const data = msg.data || {};

  // console.log(`[background] Received message [${action}]`, data);
  switch (action) {

    case "get-host":
      useService().then((s) => sendResponse(s.getHost()));
      return true;

    case "get-settings":
      useService().then((s) => sendResponse(s.getSettings()));
      return true;

    case "latest-tasks":
      useService().then((s) => s.latestTasks());
      return;

    case "new-tasks":
      useService().then((s) => s.newTasks());
      return;

    case "resume":
      useService().then((s) => s.resumeTask(data.id));
      return;
    case "pause":
      useService().then((s) => s.pauseTask(data.id));
      return;

    case "delete":
      useService().then((s) => s.deleteTask(data.id));
      return;

    case "login":
      useService()
        .then((s) => s.login(data))
        .then(sendResponse);
      return true;

    case "logout":
      useService()
        .then((s) => s.logout())
        .then(sendResponse);
      return true;
  }
});
