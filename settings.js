import Alpine from "./ui/alpine-modified.esm.js";
import settings_page from "./ui/settings_page.js";

document.title = chrome.i18n.getMessage("extSettingsTitle");

Alpine.data("settings_page", settings_page);

window.Alpine = Alpine;
Alpine.start();
