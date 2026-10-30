// lib/notifications.ts
// A notification's `actionUrl` is a resource path, not an app route; map it to this app's pages.

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const ROUTES: ReadonlyArray<{ pattern: RegExp; href: (id: string) => string }> = [
  { pattern: /^\/assignments\/([^/?#]+)\/?$/, href: (id) => `/assignments/${encodeURIComponent(id)}` },
  { pattern: /^\/programs\/([^/?#]+)\/?$/, href: (slug) => `/programs/${encodeURIComponent(slug)}` },
];

/** `/assignments/<id>` and `/programs/<slug>` open their page; anything else (or null) opens nothing. */
export function notificationHref(actionUrl: string | null): string | null {
  if (!actionUrl) return null;
  for (const { pattern, href } of ROUTES) {
    const match = pattern.exec(actionUrl);
    if (match) return href(decodeSegment(match[1]));
  }
  return null;
}
