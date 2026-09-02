import NodeWebSocket from 'ws';

// Expo Router renders web routes in Node before hydrating them in the
// browser. Node versions without a global WebSocket therefore need an
// explicit transport. Metro picks this file over realtimeTransport.ts only
// when bundling for web, so "ws" (and its Node "stream" dependency) never
// reaches the native bundle.
export const realtimeTransport =
  typeof globalThis.WebSocket === 'undefined'
    ? NodeWebSocket
    : globalThis.WebSocket;
