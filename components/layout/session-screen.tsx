// components/layout/session-screen.tsx
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { BrandMark } from './brand-logo';

export function SessionLoadingScreen({ label = 'جارٍ التحقق من الجلسة الآمنة…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background"
    >
      <BrandMark className="animate-pulse" size="lg" />
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-gold" />
        <span>{label}</span>
      </div>
    </div>
  );
}

/** Non-blocking notice shown while running on the saved session because the API is unreachable. */
export function OfflineBanner({ retrying, onRetry }: { retrying: boolean; onRetry: () => void }) {
  return (
    <div
      role="status"
      className="sticky top-0 z-[60] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-xs font-semibold text-navy-900"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      <span>تعذّر الوصول إلى الخادم — تعمل الآن على آخر جلسة محفوظة، وسنعيد المحاولة تلقائياً.</span>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="inline-flex items-center gap-1 rounded-lg bg-navy-900 px-2.5 py-1 text-[11px] text-white disabled:opacity-60"
      >
        <RefreshCw className={retrying ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} aria-hidden /> إعادة المحاولة
      </button>
    </div>
  );
}

export function SessionErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex h-screen w-full flex-col items-center justify-center gap-5 bg-background p-6 text-center">
      <div className="rounded-2xl bg-destructive/10 p-4 text-destructive">
        <WifiOff className="h-8 w-8" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-lg font-bold text-foreground">تعذّر الاتصال بالخادم</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          لم نتمكن من التحقق من جلستك. تأكد من اتصالك بالإنترنت ثم أعد المحاولة.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        <RefreshCw className="h-4 w-4" /> إعادة المحاولة
      </button>
    </div>
  );
}
