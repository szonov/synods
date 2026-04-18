export interface ResolvedUrl {
  url: string;
  type: "metadata-file" | "direct-download";
  content?: Blob;
  filename?: string;
}

export interface SuccessPostResponse {
  success: boolean;
  data: any;
}

export interface FailedPostResponse {
  success: boolean;
  type: "http-not-ok" | "timeout" | "api-error" | "unknown";
  message: string;
  code?: number; // only for "api-error" or "http-not-ok"
  api?: string; // only for "api-error"
}

export interface SuccessApiResponse {
  success: boolean;
  data: any;
}

export interface FailedApiResponse {
  success: boolean;
  type: "missing-config" | "http-not-ok" | "timeout" | "api-error" | "unknown";
  message: string;
  code?: number; // only for "api-error" or "http-not-ok"
  api?: string; // only for "api-error"
}

export type ApiResponsePromise = Promise<FailedApiResponse | SuccessApiResponse>;

export interface ApiSettings {
  host?: string;
  account?: string;
  passwd?: string;
  sid?: string;
}
