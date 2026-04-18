export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


export async function sendMessage(action, data) {
  // console.log(`[sendMessage.${action}]`, data);
  try {
    return await chrome.runtime.sendMessage({ action, data });
  } catch (error) {
    // console.log("[sendMessage.error] ", error);
  }
}
