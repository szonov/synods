export function dsmHostPermission(address) {
  const url = new URL(address);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username || url.password || url.search || url.hash ||
    url.hostname.includes("*")
  ) {
    throw new Error("Invalid DSM address");
  }

  // Match the hostname across ports for compatibility with Chrome and Firefox.
  return { origins: [`${url.protocol}//${url.hostname}/*`] };
}
