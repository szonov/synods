const POST_TIMEOUT = 10000; // 10 sec

/**
 * @import {SuccessPostResponse, FailedPostResponse} from './types.d.ts';
 */

/**
 * Detects which API name are used by the `init` parameter passed to the fetch function.
 *
 * @param {RequestInit} options
 * @returns {string}
 */
function apiName(options) {
  let b = options?.body ?? {};
  if (b instanceof FormData || b instanceof URLSearchParams) {
    return b.get("api") || "";
  }
  return "";
}

/**
 * Generate error response
 *
 * @param {"http-not-ok" | "timeout" | "api-error" | "unknown"} type
 * @param {string} message
 * @param {{code?:number, api?:string}} more
 * @returns {FailedPostResponse}
 */
function errorResponse(type, message, more = {}) {
  return { success: false, type, message, ...more };
}

/**
 * Makes HTTP POST calls which always return valid json without exceptions
 *
 * @param {string|RequestInfo|URL} url
 * @param {RequestInit} init
 * @returns {Promise<SuccessPostResponse|FailedPostResponse>}
 */
export async function post(url, init) {
  const options = {
    method: "POST",
    ...init,
  };

  const timeoutSignal = AbortSignal.timeout(POST_TIMEOUT);
  options.signal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;

  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      const code = res.status;
      return errorResponse("http-not-ok", `HTTP Error: (${code}) ${res.statusText}`, { code });
    }

    const json = await res.json();

    if (json.success) return json;

    const code = json.error?.code ?? 0;
    return errorResponse("api-error", `API Error: ${code}`, { code, api: apiName(init) });
  } catch (error) {
    return error.name === "TimeoutError"
      ? errorResponse("timeout", "Connection Timeout")
      : errorResponse("unknown", `${error.name}: ${error.message}`);
  }
}
