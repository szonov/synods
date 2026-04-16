export class PopupState {
  constructor() {
    this.host = "";
    this.account = "";
    this.passwd = "";
    this.sid = "";
    this.hasTasks = false;
    this.hasFinishedTasks = false;
    this.speedDownload = "";
    this.speedUpload = "";
    this.error = "";

    this._watch = [
      'isLoggedIn',
      'hasAccountData',
      'hasTasks',
      'hasFinishedTasks',
      'speedDownload',
      'speedUpload',
      'error'
    ];

    this._accept = [
      "host",
      "account",
      "passwd",
      "sid",
      "hasTasks",
      "hasFinishedTasks",
      'speedDownload',
      'speedUpload',
      'error'
    ];

    this.changeCallback = function (changes) {
      console.log(changes);
    }
  }

  get isLoggedIn() {
    return this.sid !== "";
  }

  get hasAccountData() {
    return this.host !== "" && this.account !== "" && this.passwd !== "";
  }

  onChange(callback) {
    this.changeCallback = callback;
  }

  set(values) {

    const oldValues = this.get()

    // apply
    for (let key in values) {
      if (this._accept.includes(key)) {
        this[key] = values[key];
      }
    }

    // compare with old
    let changes = {}
    this._watch.forEach(key => {
      if (oldValues[key] !== this[key]) {
        changes[key] = this[key];
      }
    });

    // fire event if amount of change more then 0
    if (Object.keys(changes).length > 0) {
      this.changeCallback(changes);
    }
  }
  get() {
    let values = {};
    this._watch.forEach(key => {
      values[key] = this[key];
    });
    return values;
  }
}

const state = new PopupState();
let isLoaded = false;

chrome.storage.onChanged.addListener((changes) => {
  let values = {};
  for (const key in changes) {
    values[key] = changes[key].newValue ?? "";
  }
  state.set(values);
});

export async function useState() {
  if (!isLoaded) {
    const settings = await chrome.storage.local.get({
      host: "",
      account: "",
      passwd: "",
      sid: "",
    });
    let values = {};
    for (const key in settings) {
        values[key] = settings[key];
    }
    state.set(values);
    isLoaded = true;
  }
  return state;
}
