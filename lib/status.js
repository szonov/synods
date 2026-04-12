const DEFAULT_TIMEOUT = 4000; // 4 sec

export default class {
  constructor(element) {
    this.timer = 0;
    this.element = element;
  }

  _show(className, msg, timeout) {
    clearTimeout(this.timer)
    this.element.textContent = msg;
    this.element.className = className;
    timeout = timeout <= 0 ? DEFAULT_TIMEOUT : timeout
    this.timer = setTimeout(() => {
      this.element.textContent = '';
      this.element.className = '';
    }, timeout);
  }

  neutral(msg, timeout = 0) {
    this._show('', msg, timeout);
  }
  success(msg, timeout = 0) {
    this._show('success', msg, timeout);
  }
  error(msg, timeout = 0) {
    this._show('error', msg, timeout);
  }
}
