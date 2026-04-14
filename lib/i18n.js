export function applyI18n(root = document) {
  const elements = root.querySelectorAll("[data-i18n]");
  elements.forEach((el) => {
    let attribute = "",
      key = el.getAttribute("data-i18n");

    const parts = key.split(",", 2);
    if (parts.length === 2) {
      attribute = parts[0];
      key = parts[1];
    }

    const message = chrome.i18n.getMessage(key);
    if (message) {
      if (attribute !== "") {
        el.setAttribute(attribute, message);
      } else {
        el.textContent = message;
      }
    }
  });
}
