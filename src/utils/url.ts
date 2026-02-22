/**
 * Normalize a URL — strips trailing slashes (FastAPI convention).
 */
export function normalizeUrl(
  baseUrl: string,
  endpoint: string,
  params?: Record<string, string>,
  prefix: string = 'api/v1/sdk'
): string {
  let path = endpoint.replace(/^\/+|\/+$/g, ''); // strip slashes

  if (prefix) {
    path = `${prefix}/${path}`;
  }

  const url = new URL(`/${path}`, baseUrl);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}
