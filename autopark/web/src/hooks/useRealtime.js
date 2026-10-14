import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken, onTokenChange, refresh } from '../lib/session';

// In development the Vite proxy forwards /socket.io (with a websocket
// upgrade) to the API, so same-origin works. A deployed build points at the
// API origin instead.
const socketOrigin = () => {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return explicit;
  const api = import.meta.env.VITE_API_URL;
  if (api) {
    try {
      return new URL(api, window.location.origin).origin;
    } catch {
      return window.location.origin;
    }
  }
  return window.location.origin;
};

/**
 * Subscribes to live availability for a set of parkings.
 *
 * `handlers` is read through a ref so a page can pass inline callbacks
 * without reconnecting the socket on every render.
 */
export function useRealtime(parkingIds, handlers = {}) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // A stable key: reconnecting on every array identity change would thrash.
  const idsKey = (parkingIds || []).slice().sort().join(',');

  // The access token lives in memory and appears after the session is
  // restored, so the socket waits for it instead of reading it once.
  const [hasToken, setHasToken] = useState(() => !!getAccessToken());
  useEffect(() => onTokenChange((token) => setHasToken(!!token)), []);

  useEffect(() => {
    if (!hasToken) return undefined;

    const socket = io(`${socketOrigin()}/rt`, {
      // A function, so every reconnection presents the current token rather
      // than the one that was valid when the page opened.
      auth: (cb) => cb({ token: getAccessToken() }),
      transports: ['websocket'],
      reconnectionDelay: 1000,
    });

    const ids = idsKey ? idsKey.split(',') : [];
    let retriedAuth = false;

    socket.on('connect', () => {
      retriedAuth = false;
      setConnected(true);
      if (ids.length) socket.emit('subscribe:parkings', { ids });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', async (err) => {
      setConnected(false);
      // The handshake refused an expired access token. socket.io does not
      // retry after a refusal, so refresh once and reconnect ourselves.
      if (err?.message === 'UNAUTHORIZED' && !retriedAuth) {
        retriedAuth = true;
        try {
          await refresh();
          socket.connect();
        } catch {
          // Session over; the next API call sends the user to the login page.
        }
      }
    });

    const forward = (event) => (payload) => handlersRef.current[event]?.(payload);
    const events = ['availability:update', 'spot:state', 'booking:created', 'booking:released', 'booking:checkin', 'booking:extended'];
    for (const event of events) socket.on(event, forward(event));

    return () => {
      socket.close();
    };
  }, [idsKey, hasToken]);

  return { connected };
}

export default useRealtime;
