export function setBadge(count) {
  if (count < 0) return setTextColor("!", "#C43B38");
  else if (count > 0) return setTextColor(String(count), "#0d8050");
  else return setTextColor();
}

async function setTextColor(text = "", color = "#ffffff") {
  await chrome.action.setBadgeText({ text });
  return await chrome.action.setBadgeBackgroundColor({ color });
}
