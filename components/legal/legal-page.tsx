// components/legal/legal-page.tsx
// Reading layout for the public legal pages: brand header, one text column, links between pages.
import Link from 'next/link';
import { BrandMark } from '@/components/layout/brand-logo';
import { LEGAL_CONTACT, LEGAL_PAGES, LEGAL_UPDATED_AT } from '@/lib/legal';

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-gold">
            <BrandMark size="sm" />
            <span className="font-display text-lg font-bold text-navy-900 dark:text-foreground">حاضنة TechBox</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            الصفحة الرئيسية
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article className="space-y-8">
          <header className="space-y-3 border-b pb-8">
            <h1 className="font-display text-3xl font-bold text-navy-900 dark:text-foreground sm:text-4xl">{title}</h1>
            <p className="text-sm text-muted-foreground">آخر تحديث: {LEGAL_UPDATED_AT}</p>
            <p className="max-w-[65ch] leading-8 text-foreground/85">{intro}</p>
          </header>
          <div className="legal-body space-y-10">{children}</div>
        </article>

        <nav aria-label="الصفحات القانونية" className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t pt-6 text-sm">
          {LEGAL_PAGES.map((page) => (
            <Link key={page.href} href={page.href} className="text-muted-foreground hover:text-gold">
              {page.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}

/** A numbered or titled part of a legal text. */
export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold text-navy-900 dark:text-foreground">{title}</h2>
      <div className="max-w-[65ch] space-y-3 leading-8 text-foreground/85 [&_ul>li]:ms-5 [&_ul>li]:list-disc [&_ul>li]:ps-1 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}

/** How to reach the team, from LEGAL_CONTACT. */
export function LegalContact() {
  const { email, whatsapp, linksUrl } = LEGAL_CONTACT;
  return (
    <ul>
      {email && (
        <li>
          البريد الإلكتروني:{' '}
          <a href={`mailto:${email}`} className="font-semibold text-gold hover:underline">
            <bdi dir="ltr">{email}</bdi>
          </a>
        </li>
      )}
      {whatsapp && (
        <li>
          واتساب:{' '}
          <a href={`https://wa.me/${whatsapp}`} className="font-semibold text-gold hover:underline" target="_blank" rel="noopener noreferrer">
            <bdi dir="ltr">+{whatsapp}</bdi>
          </a>
        </li>
      )}
      <li>
        حسابات الحاضنة الرسمية:{' '}
        <a href={linksUrl} className="font-semibold text-gold hover:underline" target="_blank" rel="noopener noreferrer">
          <bdi dir="ltr">linktr.ee/Tech_Box</bdi>
        </a>
      </li>
    </ul>
  );
}
