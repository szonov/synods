export function int(value) {
  const v = parseInt(value);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

export function ratio(part, total) {
  const ratio = part / total;
  return Number.isFinite(ratio) ? ratio : 0;
}

export function percent(part, total) {
    const percent = Math.round((100 * part) / total);
    return Number.isFinite(percent) ? percent : 0;
}

export function remaining(part, total, speed) {
  const remaining = Math.round((total - part) / speed);
  return Number.isFinite(remaining) ? remaining : -1;
}

/**
 * Converts size in bytes to human-readable value
 *
 * @param {number} sizeInBytes
 * @returns {string}
 */
export function humanSize(sizeInBytes) {
  const space = ' ';
  const bytes = int(sizeInBytes);
  if (bytes === 0) {
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
export function humanSpeed(speedInBytesPerSecond) {
  if (speedInBytesPerSecond === '') {
    return '\u2013.\u2013 B/s';
  }
  return humanSize(speedInBytesPerSecond) + '/s';
}

/**
 * Format Synology errors like 'broken_link' to 'Broken Link'
 *
 * @param {string} msg
 * @returns {string}
 */
export function humanError(msg) {
  return (!msg)
    ? ''
    : msg.replace(/[^a-zA-Z0-9]/, ' ').
      replace(/\s+/, ' ').
      trim().
      split(' ').
      map((w) => w.charAt(0).toUpperCase() + w.slice(1)).
      join(' ');
}

/**
 * Format seconds to human-readable time string
 *
 * @param {number} s
 * @returns {string}
 */
export function humanTime(s) {
  const hours = Math.floor(s / (60 * 60));
  const minutes = Math.floor(s / 60) - hours * 60;
  const seconds = Math.floor(s) - hours * 60 * 60 - minutes * 60;

  function withZero(n) {
    return n > 9 ? n.toString() : `0${n.toString()}`;
  }

  return `${hours ? hours + ':' : ''}${hours ? withZero(minutes) : minutes}:${withZero(seconds)}`;
}

/**
 * Format remaining seconds to human-readable string of eta
 *
 * @param {number} remaining
 * @returns {string}
 */
export function humanEta(remaining) {
  return remaining >= 0
    ? chrome.i18n.getMessage('eta_remaining', [humanTime(remaining)])
    : chrome.i18n.getMessage('eta_no_estimate');
}
