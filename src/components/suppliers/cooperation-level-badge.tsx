import { useTranslations } from "next-intl";
import { CooperationLevel } from "@/generated/prisma/client";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";

const levelToTone: Record<CooperationLevel, StatusTone> = {
  STRATEGIC:       "success",
  REGULAR:         "info",
  TRIAL_ORDER:     "warning",
  INITIAL_CONTACT: "muted",
  INACTIVE:        "danger",
};

interface Props {
  level: CooperationLevel;
}

export function CooperationLevelBadge({ level }: Props) {
  const t = useTranslations("cooperationLevel");   // ← 改了这一行
  return <StatusBadge tone={levelToTone[level]}>{t(level)}</StatusBadge>;
}