document.addEventListener("DOMContentLoaded", () => {
  // i18n
  document.querySelectorAll("[data-i18n]").forEach(($el) => {
    $el.textContent = chrome.i18n.getMessage($el.getAttribute("data-i18n"));
  });

  // DOM
  const $form = document.querySelector("login-form");
  const $clearBtn = document.querySelector("clear-settings");

  // listen 'login form' submit
  $form.addEventListener("submit", (event) => {
    $form.disable().status("", chrome.i18n.getMessage("settingsSaving"), 10000);
    $clearBtn.disable();

    chrome.runtime.sendMessage({ action: "login", data: event.detail }).then((res) => {
      $form.enable().status(res.success ? "success" : "error", res.message);
      $clearBtn.enable();
    });
  });

  // listen click on 'clear settings' button
  $clearBtn.addEventListener("submit", () => {
    chrome.runtime.sendMessage({ action: "logout" }).then(() => {
      $form.values = {};
      $form.status("success", chrome.i18n.getMessage("clearSettingsSuccess"));
    });
  });

  // load page data
  chrome.runtime.sendMessage({ action: "get-settings" }).then((settings) => {
    $form.values = settings;
  });
});
