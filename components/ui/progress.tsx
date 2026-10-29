import * as React from "react"
import { cn } from "@/lib/utils"
import { clampPercent } from "@/lib/format"

interface ProgressProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** 0–100 */
  value: number
  label: string
  indicatorClassName?: string
}

/** Linear progress. Fills from the inline-start edge, so it grows right→left in RTL. */
function Progress({ value, label, className, indicatorClassName, ...props }: ProgressProps) {
  const pct = clampPercent(value)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      data-slot="progress"
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn("h-full rounded-full bg-gold transition-[width] duration-700 ease-out", indicatorClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export { Progress }
