// Server-side helper to get absolute backend URL for Server Components
export function getBackendUrl() {
  return process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
}

// Client-side helper or isomorphic helper (relies on relative proxy /api in browser)
export function getApiUrl(path: string) {
  if (typeof window === "undefined") {
    // Server-side
    return `${getBackendUrl()}${path}`;
  }
  // Client-side goes through Next.js proxy rewrite
  return path;
}
