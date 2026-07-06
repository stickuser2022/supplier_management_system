'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Trash2, Loader2 } from 'lucide-react';
import { clearOriginalIntent } from '../original-intent/_actions/original-intent-actions';
import { Button } from '@/components/ui/button';

export function ClearOriginalIntentButton({ supplierId }: { supplierId: number }) {
  const router = useRouter();
  const t = useTranslations('originalIntent');
  const [pending, startTransition] = useTransition();

  function handleClear() {
    if (!confirm(t('confirmClear'))) return;
    startTransition(async () => {
      const res = await clearOriginalIntent(supplierId);
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Button
      type="button"
      onClick={handleClear}
      disabled={pending}
      variant="outline"
      size="sm"
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Trash2 className="size-3.5" />
      )}
      {t('clear')}
    </Button>
  );
}
