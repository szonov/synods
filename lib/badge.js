import { useApi } from "./api.js";

export default class {
  _setTextColor(text = "", color = "#ffffff") {
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color });
  }

  _setCount(count) {
    if (count < 0) this._setTextColor("!", "#C43B38");
    else if (count > 0) this._setTextColor(String(count), "#0d8050");
    else this._setTextColor();
  }

  increment() {
    chrome.action.getBadgeText({}, (txt) => {
      const c = parseInt(txt);
      this._setCount(isNaN(c) ? 1 : c + 1);
    });
  }

  loadFromApi() {
    useApi()
      .then((api) => api.getTasksCount())
      .then((count) => this._setCount(count));
  }

  setErrorState() {
    this._setCount(-1);
  }

  reset() {
    this._setCount(0);
  }

  update(value) {
    this._setCount(value);
  }

  autodetect() {
    useApi().then((api) => {
      if (api.isLoggedIn) this.loadFromApi();
      else if (api.hasAccountData) this._setCount(-1);
      else this._setCount(0);
    });
  }
}
