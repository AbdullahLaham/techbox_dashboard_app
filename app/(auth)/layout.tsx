// app/(auth)/layout.tsx
import { BrandMark } from '@/components/layout/brand-logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const currentYear = 2026; // Static constant avoiding build-time date mismatch

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Brand panel — first child, so it sits on the right in RTL */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-navy-700)_0%,transparent_60%)] opacity-60"
        />

        <div className="z-10 flex items-center gap-3">
          <BrandMark />
          <span className="bg-gradient-to-l from-white to-gold bg-clip-text text-xl font-extrabold tracking-wide text-transparent">
            حاضنة TechBox
          </span>
        </div>

        <blockquote className="z-10 max-w-md space-y-3">
          <p className="text-2xl leading-relaxed font-semibold">
            &ldquo;نمكّن الجيل القادم من المبتكرين التقنيين ومؤسسي الشركات الناشئة عبر تعلّم منظّم وإرشاد متخصص.&rdquo;
          </p>
          <footer className="text-sm font-medium text-gold">— منصة TechBox الموحّدة للتعلّم واحتضان الأعمال</footer>
        </blockquote>

        <p className="z-10 text-xs text-white/60">© {currentYear} TechBox. جميع الحقوق محفوظة.</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">{children}</div>
      </div>
    </div>
  );
}
