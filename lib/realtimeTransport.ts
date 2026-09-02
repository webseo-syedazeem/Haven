// Native platforms (Android/iOS) always have a global WebSocket, so no
// fallback transport is ever needed here. Keeping the "ws" package (which
// pulls in Node's "stream" module) out of this file keeps it out of the
// native Metro bundle entirely. The web-only fallback lives in
// realtimeTransport.web.ts.
export const realtimeTransport = globalThis.WebSocket;
