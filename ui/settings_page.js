/**
 * @import { SettingsPageComponent } from "./types.d.ts";
 */

/** @returns {SettingsPageComponent} */
export default () => ({
  loading: true,

  host: "",
  account: "",
  passwd: "",

  messageText: "",
  messageType: "",
  messageTimer: 0,

  init: async function () {
    const settings = await chrome.runtime.sendMessage({ action: "get-settings" });
    this.host = settings.host ?? "";
    this.account = settings.account ?? "";
    this.passwd = settings.passwd ?? "";
    this.loading = false;
  },

  destroy: function () {
    clearTimeout(this.messageTimer);
  },

  handleLogin: async function () {
    const data = {
      host: this.host.trim(),
      account: this.account.trim(),
      passwd: this.passwd,
    };

    if (!this._validate(data)) {
      return false;
    }

    this.loading = true;
    this._message("", chrome.i18n.getMessage("settingsSaving"), 10000);
    const res = await chrome.runtime.sendMessage({ action: "login", data });
    this._message(res.success ? "success" : "error", res.message);
    this.loading = false;
  },

  handleLogout: async function () {
    if (this.loading) {
      return;
    }

    if (!confirm(chrome.i18n.getMessage("clearSettingsConfirm"))) {
      return;
    }

    this.loading = true;

    await chrome.runtime.sendMessage({ action: "logout" });
    this.host = "";
    this.account = "";
    this.passwd = "";
    this._message("success", chrome.i18n.getMessage("clearSettingsSuccess"));

    this.loading = false;
  },

  __: function (name, ...args) {
    return chrome.i18n.getMessage(name, args);
  },

  _message(type, text, timeout = 4000) {
    clearTimeout(this.messageTimer);
    this.messageType = type;
    this.messageText = text;
    if (timeout > 0) {
      this.messageTimer = setTimeout(() => {
        this.messageType = "";
        this.messageText = "";
      }, timeout);
      return this;
    }
  },

  _validate: function ({ host, account, passwd }) {
    if (host === "" || account === "" || passwd === "") {
      this._message("error", chrome.i18n.getMessage("requiredAll"));
      return false;
    }

    if (!host.startsWith("http://") && !host.startsWith("https://")) {
      this._message("error", chrome.i18n.getMessage("invalidHost"));
      return false;
    }

    return true;
  },
});
