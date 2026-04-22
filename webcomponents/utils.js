class Utils {

  /**
   * Make integer number from any value, if value invalid 0 returned
   *
   * @param value
   * @returns {number}
   */
  static int(value) {
    const v = parseInt(value);
    return isNaN(v) || v <= 0 ? 0 : v;
  }

  /**
   * Converts size in bytes to human-readable value
   *
   * @param {number} sizeInBytes
   * @returns {string}
   */
  static humanSize(sizeInBytes) {
    const space = ' ';
    const bytes = this.int(sizeInBytes);
    if (bytes === 0)
    {
      return `0.00${space}B`;
    }
    const e = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, e)).toFixed(2)}${space}${' KMGTP'.charAt(e).trim()}B`;
  }

  /**
   * Converts speed in bytes per second to human-readable value
   *
   * @param {number|string} speedInBytesPerSecond
   * @returns {string}
   */
  static humanSpeed(speedInBytesPerSecond) {
    if (speedInBytesPerSecond === '')
    {
      return '\u2013.\u2013 B/s';
    }
    return this.humanSize(speedInBytesPerSecond) + '/s';
  }

  /**
   * Format seconds to human-readable time string
   *
   * @param {number} s
   * @returns {string}
   */
  static humanTime(s) {
    const hours = Math.floor(s / (60 * 60));
    const minutes = Math.floor(s / 60) - hours * 60;
    const seconds = Math.floor(s) - hours * 60 * 60 - minutes * 60;

    function withZero(n) {
      return n > 9 ? n.toString() : `0${n.toString()}`;
    }

    return `${hours ? hours + ':' : ''}${hours ? withZero(minutes) : minutes}:${withZero(seconds)}`;
  }

  static formatErrorDetails(msg) {
    return msg === ''
      ? ''
      : msg.replace(/[^a-zA-Z0-9]/, ' ').
        replace(/\s+/, ' ').
        trim().
        split(' ').
        map((w) => w.charAt(0).toUpperCase() + w.slice(1)).
        join(' ');
  }

  static applyI18n(root) {
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

}



