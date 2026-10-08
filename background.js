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

const MENU_CONTEXTS = ["link", "audio", "video", "image"];

async function rebuildContextMenu() {
  const settings = await useService().then((service) => service.getSettings());
  const active = settings.accounts.find((account) => account.id === settings.activeAccountId);
  await chrome.contextMenus.removeAll();
  const title = active
    ? chrome.i18n.getMessage("contextMenuAddAccount", active.name)
    : chrome.i18n.getMessage("contextMenuAdd");
  const destinations = active?.destinations || [];

  if (destinations.length === 0) {
    chrome.contextMenus.create({ id: "download-default", title, contexts: MENU_CONTEXTS });
    return;
  }

  chrome.contextMenus.create({ id: "download-root", title, contexts: MENU_CONTEXTS });
  chrome.contextMenus.create({
    id: "download-default",
    parentId: "download-root",
    title: chrome.i18n.getMessage("defaultDestination"),
    contexts: MENU_CONTEXTS,
  });
  destinations.forEach((destination, index) => chrome.contextMenus.create({
    id: `download-destination:${index}`,
    parentId: "download-root",
    title: destination,
    contexts: MENU_CONTEXTS,
  }));
}

// Events are triggered when the browser is launched.
chrome.runtime.onStartup.addListener(() => {
  rebuildContextMenu();
  useService().then((s) => s.initializeBadge());
});

// Events are triggered when an extension is installed for the first time or updated.
chrome.runtime.onInstalled.addListener(() => {
  rebuildContextMenu();
  useService().then((s) => s.initializeBadge());
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const menuItemId = String(info.menuItemId);
  if (menuItemId !== "download-default" && !menuItemId.startsWith("download-destination:")) {
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

  useService().then((service) => {
    const settings = service.getSettings();
    const active = settings.accounts.find((account) => account.id === settings.activeAccountId);
    const index = Number.parseInt(menuItemId.split(":")[1], 10);
    const destination = Number.isInteger(index) ? active?.destinations?.[index] || "" : "";
    return service.createDownloadTask(downloadUrl, resolver, destination);
  });
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
          if (response.success) await rebuildContextMenu();
          return response;
        })
        .then(sendResponse);
      return true;

    case "delete-account":
      useService()
        .then((s) => s.deleteAccount(data.id))
        .then(async (response) => {
          await rebuildContextMenu();
          return response;
        })
        .then(sendResponse);
      return true;

    case "set-active-account":
      useService()
        .then((s) => s.setActiveAccount(data.id))
        .then(async (response) => {
          if (response.success) await rebuildContextMenu();
          return response;
        })
        .then(sendResponse);
      return true;
  }
});
