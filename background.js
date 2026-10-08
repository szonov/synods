import { useService } from "./background/service.js";
import { resolveUrlRequest, restoreResolvedUrl } from "./background/dsm_api/url_resolver.js";

function isSameOrigin(left, right) {
  try {
    return new URL(left).origin === new URL(right).origin;
  } catch (error) {
    return false;
  }
}

async function resolveUrlInTab(tabId, frameId, url) {
  const target = Number.isInteger(frameId) ? { tabId, frameIds: [frameId] } : { tabId };
  const results = await chrome.scripting.executeScript({
    target,
    world: "MAIN",
    func: resolveUrlRequest,
    args: [url],
  });

  const result = results[0]?.result;
  if (!result) {
    throw new Error("The page did not return a download result");
  }

  return restoreResolvedUrl(result);
}

async function updateContextMenu() {
  const settings = await useService().then((service) => service.getSettings());
  const active = settings.accounts.find((account) => account.id === settings.activeAccountId);
  await chrome.contextMenus.update("addToSynology", {
    title: active
      ? chrome.i18n.getMessage("contextMenuAddAccount", active.name)
      : chrome.i18n.getMessage("contextMenuAdd"),
  });
}

// Events are triggered when the browser is launched.
chrome.runtime.onStartup.addListener(() => {
  updateContextMenu();
  useService().then((s) => s.initializeBadge());
});

// Events are triggered when an extension is installed for the first time or updated.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToSynology",
    title: chrome.i18n.getMessage("contextMenuAdd"),
    contexts: ["link", "audio", "video", "image"],
  });
  updateContextMenu();
  useService().then((s) => s.initializeBadge());
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "addToSynology") {
    return;
  }
  const downloadUrl = info.linkUrl ?? info.srcUrl ?? "";
  if (!downloadUrl) {
    return;
  }
  let resolver;
  if (Number.isInteger(tab?.id) && isSameOrigin(downloadUrl, info.pageUrl ?? tab.url ?? "")) {
    resolver = (url) => resolveUrlInTab(tab.id, info.frameId, url);
  }

  useService().then((s) => s.createDownloadTask(downloadUrl, resolver));
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

    case "save-account":
      useService()
        .then((s) => s.saveAccount(data))
        .then(async (response) => {
          if (response.success) await updateContextMenu();
          return response;
        })
        .then(sendResponse);
      return true;

    case "delete-account":
      useService()
        .then((s) => s.deleteAccount(data.id))
        .then(async (response) => {
          await updateContextMenu();
          return response;
        })
        .then(sendResponse);
      return true;

    case "set-active-account":
      useService()
        .then((s) => s.setActiveAccount(data.id))
        .then(async (response) => {
          if (response.success) await updateContextMenu();
          return response;
        })
        .then(sendResponse);
      return true;
  }
});
