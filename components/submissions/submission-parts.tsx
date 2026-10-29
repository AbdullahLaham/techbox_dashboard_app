// components/submissions/submission-parts.tsx
// Pieces shared by the student's attempts and the reviewers' screens.
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Link2,
  Presentation,
  RotateCcw,
  TimerOff,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatFileSize } from '@/lib/assignment-format';
import { SUBMISSION_STATUS_LABELS } from '@/lib/labels';
import type { SubmissionContent, SubmissionStatus } from '@/types/submissions.contract';

export function fileIconFor(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/') || mimeType.includes('wordprocessingml')) return FileText;
  if (mimeType.includes('spreadsheetml')) return FileSpreadsheet;
  if (mimeType.includes('presentationml')) return Presentation;
  if (mimeType.includes('zip')) return FileArchive;
  return File;
}

const STATUS_STYLE = {
  SUBMITTED: { variant: 'gold', icon: Clock },
  UNDER_REVIEW: { variant: 'navy', icon: Eye },
  NEEDS_REVISION: { variant: 'warning', icon: RotateCcw },
  GRADED: { variant: 'success', icon: CheckCircle2 },
  REJECTED: { variant: 'danger', icon: XCircle },
} as const;

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const { variant, icon: Icon } = STATUS_STYLE[status];
  return (
    <Badge variant={variant}>
      <Icon aria-hidden /> {SUBMISSION_STATUS_LABELS[status]}
    </Badge>
  );
}

export function LateBadge() {
  return (
    <Badge variant="danger">
      <TimerOff aria-hidden /> متأخر
    </Badge>
  );
}

/** What was handed in: the text, the links and the files (signed links, about 1 hour). */
export function SubmissionContentView({ content, textLabel }: { content: SubmissionContent; textLabel: string }) {
  const empty = !content.text && content.links.length === 0 && content.files.length === 0;
  if (empty) return <p className="text-xs text-muted-foreground">لا يوجد محتوى.</p>;

  return (
    <div className="space-y-4">
      {content.text && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground">{textLabel}</p>
          <p dir="auto" className="rounded-xl bg-muted/40 p-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {content.text}
          </p>
        </div>
      )}

      {content.links.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground">الروابط</p>
          <ul className="space-y-2">
            {content.links.map((link, i) => (
              <li key={`${i}-${link}`}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-3 rounded-xl border bg-background p-3 transition-colors hover:border-gold/40 hover:bg-muted/30"
                >
                  <Link2 className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <span dir="ltr" className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-foreground">
                    {link}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.files.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground">الملفات</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {content.files.map((file) => {
              const Icon = fileIconFor(file.mimeType);
              return (
                <li key={file.id}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border bg-background p-3 transition-colors hover:border-gold/40 hover:bg-muted/30"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-gold" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-foreground">
                        <bdi>{file.fileName}</bdi>
                      </span>
                      <span className="block text-[11px] text-muted-foreground tabular-nums">{formatFileSize(file.sizeBytes)}</span>
                    </span>
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
