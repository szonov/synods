import API from "./lib/api.js";

chrome.runtime.onStartup.addListener(() => {
  console.log("[chrome.runtime.onStartup]");
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("[chrome.runtime.onInstalled]");
  // Create context menu
  chrome.contextMenus.create({
    id: "addToSynology",
    title: chrome.i18n.getMessage("contextMenuAdd"),
    contexts: ["link", "audio", "video", "image"],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("[chrome.contextMenus.onClicked]");

  if (info.menuItemId === "addToSynology") {
    const downloadUrl = info.linkUrl ?? info.srcUrl ?? "";
    if (!downloadUrl) {
      return;
    }

    console.log("Add to Synology: ... ", downloadUrl);
    API.createTask(downloadUrl).then((response) => {
      console.log("FINAL RESPONSE", response);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "New download added",
        message: downloadUrl,
      });
    });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("[chrome.runtime.onMessage]: ", msg);
  switch (msg.action) {
    case "login":
      API.login().then(sendResponse);
      break;

    case "tasks":
      API.getTasks().then(sendResponse);
      break;

    case "resume":
      API.resumeTask(msg.data.id).then(sendResponse);
      break;

    case "pause":
      API.pauseTask(msg.data.id).then(sendResponse);
      break;

    case "delete":
      API.deleteTask(msg.data.id).then(sendResponse);
      break;
  }
  return true;
});
