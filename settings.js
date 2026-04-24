document.addEventListener("DOMContentLoaded", () => {

  // document.title = chrome.i18n.getMessage('extSettingsTitle');

  const ico = document.createElement('svg-icon');
  ico.size = 200
  ico.name = "paused"
  // ico.setAttribute("size", "100")
  // ico.setAttribute("name", "resume")
  document.body.appendChild(ico);


  // DOM
  const $form = document.querySelector("login-form");
  const $clearBtn = document.querySelector("clear-settings");

  const $clearLink = document.querySelector("clear-link");

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

  $clearLink.addEventListener("submit", (event) => {
    console.log('CLEAR SETTINGS');
  })

  // load page data
  chrome.runtime.sendMessage({ action: "get-settings" }).then((settings) => {
    $form.values = settings;
  });
});
