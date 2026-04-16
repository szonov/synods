const MAX_TORRENT_META_FILE_SIZE = 5242880; // 5MB

export default class {
  constructor(url) {
    this.url = url;
    this.type = "direct-download";
    this.content = null;
    this.filename = null;
  }

  /**
   * Сollects information about the current URL
   */
  async resolve() {
    const isTorrent = await this._isTorrent();

    if (!isTorrent) return;

    try {
      const response = await fetch(this.url, {
        signal: AbortSignal.timeout(10000),
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        return;
      }

      let blob = await response.blob();
      const filename = this._extractFilename(response.headers.get("content-disposition"));

      this.type = "metadata-file";
      this.content = blob;
      this.filename = filename || "[torrent].torrent";
    } catch (e) {}
  }

  /**
   * Checks if current url is torrent meta file
   */
  async _isTorrent() {
    try {
      const response = await fetch(this.url, {
        signal: AbortSignal.timeout(10000),
        method: "HEAD",
        credentials: "include",
      });

      if (!response.ok) {
        return false;
      }

      const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
      const rawContentLength = parseInt(response.headers.get("content-length") ?? 0);

      if (!contentType.includes("application/x-bittorrent") || isNaN(rawContentLength)) {
        return false;
      }

      return rawContentLength > 0 && rawContentLength <= MAX_TORRENT_META_FILE_SIZE;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get file name from 'content-disposition' response header
   *
   * @param {string} contentDispositionHeader
   * @returns {string}
   */
  _extractFilename(contentDispositionHeader) {
    if (!contentDispositionHeader) return "";

    const regex = /filename\s*=\s*("([^"]*)"|'([^']*)'|([^;]+))/i;
    const match = contentDispositionHeader.match(regex);

    return match ? (match[3] || match[2] || match[1]).trim() : "";
  }
}
