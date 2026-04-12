export function applyI18n(root = document) {
  const elements = root.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
        el.placeholder = message;
      } else {
        el.textContent = message;
      }
    }
  });
}

export function getMessage(key, ...substitutions) {
  return chrome.i18n.getMessage(key, substitutions)
}