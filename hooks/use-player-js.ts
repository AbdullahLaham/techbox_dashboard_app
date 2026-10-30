// hooks/use-player-js.ts
// Listens to an embedded video player that speaks the Player.js postMessage protocol
// (Bunny Stream's iframe player does). No library: subscribe to events, receive them.
import { useEffect, useRef, type RefObject } from 'react';
import { isEmbeddableVideo } from '@/lib/lessons';

const CONTEXT = 'player.js';
const VERSION = '0.0.11';

export type PlayerEvent =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'ended' }
  /** Fires several times a second while playing. */
  | { type: 'timeupdate'; seconds: number; duration: number };

const EVENTS = ['play', 'pause', 'ended', 'timeupdate'] as const;

type PlayerMessage = { context?: string; event?: string; value?: { seconds?: number; duration?: number } };

function parse(data: unknown): PlayerMessage | null {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as PlayerMessage;
    } catch {
      return null;
    }
  }
  return typeof data === 'object' && data !== null ? (data as PlayerMessage) : null;
}

/**
 * Calls `onEvent` for the player's play, pause, ended and timeupdate events. Players that do not
 * speak Player.js simply never send anything. Returns `subscribe`, to call from the iframe's onLoad
 * as well (in case the player announced itself before this listener existed).
 */
export function usePlayerJs(iframeRef: RefObject<HTMLIFrameElement | null>, src: string, onEvent: (event: PlayerEvent) => void) {
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  const subscribeRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    let origin: string;
    try {
      origin = new URL(src).origin;
    } catch {
      return;
    }

    const subscribe = () => {
      const target = iframeRef.current?.contentWindow;
      if (!target) return;
      for (const event of EVENTS) {
        target.postMessage(
          JSON.stringify({ context: CONTEXT, version: VERSION, method: 'addEventListener', value: event, listener: event }),
          origin,
        );
      }
    };
    subscribeRef.current = subscribe;

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin || e.source !== iframeRef.current?.contentWindow) return;
      const msg = parse(e.data);
      if (msg?.context !== CONTEXT || !msg.event) return;
      if (msg.event === 'ready') return subscribe();
      if (msg.event === 'timeupdate') {
        const seconds = Number(msg.value?.seconds);
        const duration = Number(msg.value?.duration);
        if (Number.isFinite(seconds)) onEventRef.current({ type: 'timeupdate', seconds, duration: Number.isFinite(duration) ? duration : 0 });
      } else if (msg.event === 'play' || msg.event === 'pause' || msg.event === 'ended') {
        onEventRef.current({ type: msg.event });
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      subscribeRef.current = () => undefined;
    };
  }, [iframeRef, src]);

  return { subscribe: () => subscribeRef.current() };
}

/** Bunny's embed starts at `t` (seconds). Other URLs are returned unchanged. */
export function withStartTime(url: string, seconds: number): string {
  if (seconds <= 0 || !isEmbeddableVideo(url)) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('t', String(Math.floor(seconds)));
    return u.toString();
  } catch {
    return url;
  }
}
