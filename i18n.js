// i18n.js - Apply translations to elements with data-i18n attribute

function applyI18n() {
  const elements = document.querySelectorAll('[data-i18n]');
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