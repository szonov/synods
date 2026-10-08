/**
 * @import { SettingsPageComponent } from "./types.d.ts";
 */

/** @returns {SettingsPageComponent} */
export default () => ({
  loading: true,
  accounts: [],
  selectedId: "",
  activeAccountId: "",
  name: "",
  host: "",
  account: "",
  passwd: "",
  destinationsText: "",

  messageText: "",
  messageType: "",
  messageTimer: 0,
  _storageListener: null,

  init: async function () {
    this._storageListener = this._handleStorageChange.bind(this);
    chrome.storage.onChanged.addListener(this._storageListener);
    const settings = await chrome.runtime.sendMessage({ action: "get-settings" });
    this.accounts = settings.accounts ?? [];
    this.activeAccountId = settings.activeAccountId ?? "";
    this.selectAccount(this.accounts[0]?.id || "");
    this.loading = false;
  },

  destroy: function () {
    clearTimeout(this.messageTimer);
    chrome.storage.onChanged.removeListener(this._storageListener);
    this._storageListener = null;
  },

  _handleStorageChange: function (changes, areaName) {
    if (areaName === "local" && changes.activeAccountId) {
      this.activeAccountId = changes.activeAccountId.newValue || "";
    }
  },

  selectAccount: function (id) {
    const account = this.accounts.find((item) => item.id === id);
    this.selectedId = account?.id || "";
    this.name = account?.name || "";
    this.host = account?.host || "";
    this.account = account?.account || "";
    this.passwd = account?.passwd || "";
    this.destinationsText = (account?.destinations || []).join("\n");
  },

  addAccount: function () {
    this.selectAccount("");
  },

  handleSave: async function () {
    const data = {
      id: this.selectedId,
      name: this.name.trim(),
      host: this.host.trim(),
      account: this.account.trim(),
      passwd: this.passwd,
      destinations: [...new Set(this.destinationsText.split("\n").map((item) => item.trim()).filter(Boolean))],
    };

    if (!this._validate(data)) {
      return false;
    }

    this.loading = true;
    this._message("", chrome.i18n.getMessage("settingsSaving"), 10000);
    const res = await chrome.runtime.sendMessage({ action: "save-account", data });
    this._message(res.success ? "success" : "error", res.message);
    if (res.success) {
      const settings = await chrome.runtime.sendMessage({ action: "get-settings" });
      this.accounts = settings.accounts;
      this.activeAccountId = settings.activeAccountId;
      this.selectAccount(res.id);
    }
    this.loading = false;
  },

  handleDelete: async function () {
    if (this.loading) {
      return;
    }

    if (!confirm(chrome.i18n.getMessage("deleteAccountConfirm"))) {
      return;
    }

    this.loading = true;

    await chrome.runtime.sendMessage({ action: "delete-account", data: { id: this.selectedId } });
    const settings = await chrome.runtime.sendMessage({ action: "get-settings" });
    this.accounts = settings.accounts;
    this.activeAccountId = settings.activeAccountId;
    this.selectAccount(this.accounts[0]?.id || "");

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

  _validate: function ({ name, host, account, passwd }) {
    if (name === "" || host === "" || account === "" || passwd === "") {
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
