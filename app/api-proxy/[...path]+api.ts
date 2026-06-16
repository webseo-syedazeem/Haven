const REMOTE_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://18.171.253.186';
const PROXY_TIMEOUT_MS = 5000;

function createCorsHeaders(headers = new Headers()) {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  return headers;
}

function createProxyErrorResponse(message: string, status = 504) {
  return new Response(
    JSON.stringify({
      error: message,
      message,
      success: false,
    }),
    {
      headers: createCorsHeaders(new Headers({ 'Content-Type': 'application/json' })),
      status,
    }
  );
}

function getTargetUrl(request: Request) {
  const url = new URL(request.url);
  const proxyPrefix = '/api-proxy';
  const path = url.pathname.startsWith(proxyPrefix)
    ? url.pathname.slice(proxyPrefix.length)
    : url.pathname;

  return `${REMOTE_API_BASE_URL}${path}${url.search}`;
}

async function proxyRequest(request: Request) {
  const headers = new Headers(request.headers);
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), PROXY_TIMEOUT_MS);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');
  headers.delete('connection');

  const init: RequestInit = {
    headers,
    method: request.method,
    signal: abortController.signal,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  let response: Response;

  try {
    response = await fetch(getTargetUrl(request), init);
  } catch (error) {
    const isTimeout = abortController.signal.aborted;
    const message = isTimeout
      ? 'Request timed out. Please try again.'
      : error instanceof Error && error.message
        ? error.message
        : 'Unable to reach API server.';

    return createProxyErrorResponse(message, isTimeout ? 504 : 502);
  } finally {
    clearTimeout(timeoutId);
  }

  const responseHeaders = createCorsHeaders(new Headers(response.headers));

  return new Response(await response.text(), {
    headers: responseHeaders,
    status: response.status,
    statusText: response.statusText,
  });
}

export function OPTIONS() {
  return new Response(null, {
    headers: createCorsHeaders(),
    status: 204,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
