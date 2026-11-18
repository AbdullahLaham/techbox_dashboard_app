// lib/legal.ts
// Shared facts for the public legal pages (/privacy, /terms, /delete-account).
//
// The texts are a first draft written from what the platform actually stores and does
// (backend schema and API, November 2026). The TechBox lead must review them before launch,
// and a lawyer should if possible. Update LEGAL_UPDATED_AT whenever a text changes.

/** Shown as "آخر تحديث" on every legal page. Change it with every edit of a text. */
export const LEGAL_UPDATED_AT = '18 نوفمبر 2026';

/** Name used for the service and its operator in the legal texts. */
export const LEGAL_ENTITY = 'حاضنة TechBox';

/** Public, fully static pages: shown without the dashboard sidebar and open to everyone. */
export const LEGAL_ROUTES = ['/privacy', '/terms', '/delete-account'] as const;

export function isLegalRoute(pathname: string): boolean {
  return LEGAL_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Where people send privacy questions and deletion requests. Set NEXT_PUBLIC_SUPPORT_EMAIL and
 * NEXT_PUBLIC_SUPPORT_WHATSAPP (digits, international format) before building for production;
 * without them the pages point to the official accounts linked on the landing page.
 */
export const LEGAL_CONTACT = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || null,
  whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/[^\d]/g, '') || null,
  /** Always available: the official accounts. */
  linksUrl: 'https://linktr.ee/Tech_Box',
} as const;

export const LEGAL_PAGES = [
  { href: '/privacy', label: 'سياسة الخصوصية' },
  { href: '/terms', label: 'شروط الاستخدام' },
  { href: '/delete-account', label: 'حذف الحساب' },
] as const;
