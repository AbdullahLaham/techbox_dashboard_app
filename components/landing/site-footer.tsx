// components/landing/site-footer.tsx
import Link from 'next/link';
import { ArrowUpLeft, Link2, MapPin } from 'lucide-react';
import { BrandMark } from '@/components/layout/brand-logo';
import { cn } from '@/lib/utils';
import { CONTACT, NAV_LINKS } from './content';
import { InstagramGlyph } from './instagram-glyph';
import { Reveal } from './reveal';
import { CONTAINER } from './section-header';

// Static, like the auth layout: a render-time Date would make this page dynamic under cacheComponents.
const CURRENT_YEAR = 2026;

const PLATFORM_LINKS = [
  { label: 'دليل البرامج', href: '/programs' },
  { label: 'إنشاء حساب', href: '/register' },
  { label: 'تسجيل الدخول', href: '/login' },
] as const;

const LINK_CLASS =
  'rounded text-sm text-navy-900/65 transition-colors outline-none hover:text-gold-ink focus-visible:ring-2 focus-visible:ring-gold';

export function SiteFooter() {
  return (
    <footer
      id="contact"
      aria-labelledby="contact-title"
      className="relative isolate scroll-mt-20 overflow-hidden border-t border-navy-900/[0.06] bg-[#edf1f7] pt-20 pb-10"
    >
      {/* Oversized wordmark watermark */}
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-[0.18em] -z-10 text-center font-display text-[clamp(6rem,22vw,20rem)] leading-none font-bold tracking-tight text-navy-900/[0.035] select-none"
      >
        TechBox
      </p>

      <div className={CONTAINER}>
        {/* Contact: the channels TechBox actually uses */}
        <Reveal className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center lg:gap-16">
          <div className="space-y-3 text-center lg:text-start">
            <h2 id="contact-title" className="font-display text-[clamp(1.75rem,1.2rem+2vw,2.5rem)] font-bold text-navy-900">
              {CONTACT.title}
            </h2>
            <p className="mx-auto max-w-md leading-relaxed text-muted-foreground lg:mx-0">{CONTACT.description}</p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-3">
            {CONTACT.socials.map((social) => (
              <li key={social.href}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col gap-4 rounded-2xl border border-navy-900/[0.07] bg-white/80 p-5 shadow-[0_1px_2px_rgb(13_24_41/0.04)] transition-[transform,border-color,box-shadow] duration-300 outline-none hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_20px_40px_-26px_rgb(138_90_6/0.6)] focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <span className="flex items-center justify-between">
                    <span
                      className={cn(
                        'grid size-10 place-items-center rounded-xl text-white',
                        social.kind === 'instagram' ? 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' : 'bg-navy-900',
                      )}
                    >
                      {social.kind === 'instagram' ? <InstagramGlyph className="size-5" /> : <Link2 className="size-5" aria-hidden />}
                    </span>
                    <ArrowUpLeft
                      className="size-4 text-navy-900/40 transition-[transform,color] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold-ink"
                      aria-hidden
                    />
                  </span>
                  <span className="space-y-0.5">
                    <span className="block font-display font-bold text-navy-900">{social.label}</span>
                    <bdi dir="ltr" className="block text-end text-sm text-muted-foreground">
                      {social.handle}
                    </bdi>
                  </span>
                </a>
              </li>
            ))}
            <li className="flex flex-col gap-4 rounded-2xl border border-navy-900/[0.07] bg-white/60 p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-gold/15 text-gold-ink">
                <MapPin className="size-5" aria-hidden />
              </span>
              <span className="space-y-0.5">
                <span className="block font-display font-bold text-navy-900">مقرّنا</span>
                <span className="block text-sm text-muted-foreground">{CONTACT.location}</span>
              </span>
            </li>
          </ul>
        </Reveal>

        <div className="mt-16 grid gap-12 border-t border-navy-900/[0.08] pt-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="space-y-5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <BrandMark size="sm" />
              <span className="font-display text-xl font-bold text-navy-900">حاضنة TechBox</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              حاضنة أعمال ومنصة تعليمية تمكّن مواهب التقنية القادمة وتبني الشركات الناشئة في غزة.
            </p>
          </div>

          <FooterColumn title="الصفحة">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={LINK_CLASS}>
                  {link.label}
                </a>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="المنصة">
            {PLATFORM_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={LINK_CLASS}>
                  {link.label}
                </Link>
              </li>
            ))}
          </FooterColumn>
        </div>

        <p className="mt-14 border-t border-navy-900/[0.06] pt-8 text-center text-xs text-navy-900/50 sm:text-start">
          © {CURRENT_YEAR} TechBox. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm font-bold text-navy-900">{title}</h3>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}
