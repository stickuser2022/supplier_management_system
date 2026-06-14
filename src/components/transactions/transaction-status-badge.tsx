import { useTranslations } from 'next-intl';
import { TransactionStatus } from '@/generated/prisma/client';
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';

const statusToTone: Record<TransactionStatus, StatusTone> = {
  IN_PROGRESS: 'info',     // 进行中 → 淡蓝
  COMPLETED:   'success',  // 已完结 → 淡绿
  CANCELLED:   'danger',   // 已取消 → 淡红
};

interface Props {
  status: TransactionStatus;
}

export function TransactionStatusBadge({ status }: Props) {
  const t = useTranslations('transactions.statuses');
  return <StatusBadge tone={statusToTone[status]}>{t(status)}</StatusBadge>;
}