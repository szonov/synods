import Alpine from "./ui/alpine-modified.esm.js";
import popup_page from "./ui/popup_page.js";
import SvgIcon from "./ui/svg_icon_element.js";

customElements.define("svg-icon", SvgIcon);
document.title = chrome.i18n.getMessage("extName");

Alpine.data("popup_page", popup_page);

window.Alpine = Alpine;
Alpine.start();
