const REMOTE_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://18.171.253.186';

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
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');
  headers.delete('connection');

  const init: RequestInit = {
    headers,
    method: request.method,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  const response = await fetch(getTargetUrl(request), init);
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  return new Response(await response.text(), {
    headers: responseHeaders,
    status: response.status,
    statusText: response.statusText,
  });
}

export function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    },
    status: 204,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;

