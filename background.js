import * as API from "./lib/api.js";

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu
  chrome.contextMenus.create({
    id: "addToSynology",
    title: chrome.i18n.getMessage("contextMenuAdd"),
    contexts: ["link", "audio", "video", "image"],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToSynology") {
    const url = info.linkUrl;
    // TODO: Add download via Synology API
    console.log("Add to Synology:", url);

    // Show notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: chrome.i18n.getMessage("extName"),
      message: chrome.i18n.getMessage("taskAdded"),
    });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log(">> chrome.runtime.onMessage", sender);
  switch (msg.action) {
    case "login":
      API.login().then(sendResponse)
      break;
  }
  return true;
});

// chrome.storage.onChanged.addListener((changes, areaName) => {
//   console.log(">> chrome.storage.onChanged.addListener", changes, areaName);
// });
// TODO: Add API call functions
// TODO: Add session management
