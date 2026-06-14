import { cn } from "@/lib/utils";

export type StatusTone = "success" | "info" | "warning" | "danger" | "muted";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-success-bg text-success-fg",
  info:    "bg-info-bg text-info-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger:  "bg-danger-bg text-danger-fg",
  muted:   "bg-muted text-muted-foreground",
};

interface StatusBadgeProps {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}