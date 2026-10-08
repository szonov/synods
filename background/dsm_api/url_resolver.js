/**
 * @import {ResolvedUrl} from './types.d.ts';
 */

/**
 * Resolve a URL either in the background or inside the page that initiated
 * the context menu. This function is passed directly to
 * chrome.scripting.executeScript, so it must remain self-contained.
 *
 * @param {string} url
 * @returns {Promise<object>}
 */
export async function resolveUrlRequest(url) {
  const maxFileSize = 5242880; // 5MB
  const checkTimeout = 10000; // 10 sec
  const fetchTimeout = 10000; // 10 sec

  const headResponse = await fetch(url, {
    signal: AbortSignal.timeout(checkTimeout),
    method: "HEAD",
    credentials: "include",
  });

  if (!headResponse.ok) {
    throw new Error(`Torrent check failed with HTTP ${headResponse.status}`);
  }

  const contentType = (headResponse.headers.get("content-type") ?? "").toLowerCase();
  const contentLength = Number.parseInt(headResponse.headers.get("content-length") ?? "0", 10);

  if (
    !contentType.includes("application/x-bittorrent") ||
    !Number.isFinite(contentLength) ||
    contentLength <= 0 ||
    contentLength > maxFileSize
  ) {
    return { type: "direct-download", url };
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(fetchTimeout),
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Torrent download failed with HTTP ${response.status}`);
  }

  const content = await response.blob();
  if (content.size <= 0 || content.size > maxFileSize) {
    throw new Error(`Unexpected torrent file size: ${content.size}`);
  }

  const bytes = new Uint8Array(await content.arrayBuffer());
  let binary = "";
  const chunkSize = 32768;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return {
    type: "metadata-file",
    url,
    contentBase64: btoa(binary),
    contentType: content.type || "application/x-bittorrent",
    contentDisposition: response.headers.get("content-disposition") ?? "",
  };
}

/**
 * Convert a JSON-safe transported result into a ResolvedUrl.
 *
 * @param {object} result
 * @returns {import('./types.d.ts').ResolvedUrl}
 */
export function restoreResolvedUrl(result) {
  if (result.type !== "metadata-file") {
    return result;
  }

  const binary = atob(result.contentBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return {
    type: "metadata-file",
    url: result.url,
    content: new Blob([bytes], { type: result.contentType }),
    filename: extractFilename(result.contentDisposition) || "[torrent].torrent",
  };
}

/**
 * Resolve url
 *
 * @param {string} url
 * @returns {Promise<ResolvedUrl>}
 */
export async function resolveUrl(url) {
  try {
    const result = await resolveUrlRequest(url);
    return restoreResolvedUrl(result);
  } catch (error) {
    return { type: "direct-download", url };
  }
}

function extractFilename(contentDispositionHeader) {
  if (!contentDispositionHeader) return "";

  const regex = /filename\s*=\s*("([^"]*)"|'([^']*)'|([^;]+))/i;
  const match = contentDispositionHeader.match(regex);

  return match ? (match[3] || match[2] || match[1]).trim() : "";
}
