/**
 * @import {ResolvedUrl} from './types.d.ts';
 */

const MAX_TORRENT_META_FILE_SIZE = 5242880; // 5MB
const CHECK_TORRENT_META_TIMEOUT = 10000; // 10 sec
const FETCH_TORRENT_META_TIMEOUT = 10000; // 10 sec

/**
 * Resolve url
 *
 * @param {string} url
 * @returns {Promise<ResolvedUrl>}
 */
export async function resolveUrl(url) {
  const isTorrent = await isTorrentFile(url);
  if (isTorrent) {
    try {
      const { content, filename } = await fetchTorrentFile(url);
      return { type: "metadata-file", url, content, filename };
    } catch (e) {}
  }

  return { type: "direct-download", url };
}

async function isTorrentFile(url) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(CHECK_TORRENT_META_TIMEOUT),
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

async function fetchTorrentFile(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TORRENT_META_TIMEOUT),
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Bad response");
  }

  const content = await response.blob();
  const header = response.headers.get("content-disposition");
  const filename = extractFilename(header) || "[torrent].torrent";

  return { content, filename };
}

function extractFilename(contentDispositionHeader) {
  if (!contentDispositionHeader) return "";

  const regex = /filename\s*=\s*("([^"]*)"|'([^']*)'|([^;]+))/i;
  const match = contentDispositionHeader.match(regex);

  return match ? (match[3] || match[2] || match[1]).trim() : "";
}
