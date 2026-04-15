const MAX_TORRENT_META_FILE_SIZE = 5242880; // 5MB

async function isTorrentMetaFile(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      credentials: "include",
      signal: AbortSignal.timeout(10000),
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

export async function resolveUrl(url) {
  const defaultResponse = { type: "direct-download", url };

  const isTorrentMeta = await isTorrentMetaFile(url);

  if (!isTorrentMeta) {
    return defaultResponse;
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return defaultResponse;
    }

    let blob = await response.blob();

    return {
      type: "metadata-file",
      url,
      content: blob,
      filename: extractFilename(response.headers.get("content-disposition")) || "[torrent].torrent",
    };
  } catch (e) {
    return defaultResponse;
  }
}

function extractFilename(contentDispositionHeader) {
  if (!contentDispositionHeader) return "";
  const regex = /filename\s*=\s*("([^"]*)"|'([^']*)'|([^;]+))/i;
  const match = contentDispositionHeader.match(regex);
  if (!match) return "";

  return (match[3] || match[2] || match[1]).trim();
}
