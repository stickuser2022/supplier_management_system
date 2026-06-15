'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { changePassword } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * 改密码页 —— 用户自助
 *
 * 走 better-auth 客户端 SDK 的 changePassword:
 *   - 需要当前密码作为身份证明
 *   - 不需要 server action(better-auth 自带 API 路由)
 *   - 改完不会 invalidate 其他 session(better-auth 默认行为)
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const t = useTranslations('changePassword');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError(t('errorTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('errorMismatch'));
      return;
    }
    if (newPassword === currentPassword) {
      setError(t('errorSameAsOld'));
      return;
    }

    setSubmitting(true);
    try {
      const result = await changePassword({ currentPassword, newPassword });
      if (result.error) {
        // better-auth 把 "当前密码错" 类的错误归在 result.error
        setError(t('errorWrongCurrent'));
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSubmitting(false);
    } catch {
      setError(t('errorDefault'));
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <Link
        href="/suppliers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-4" />
        {t('back')}
      </Link>

      <h1 className="text-2xl font-semibold text-foreground mb-1">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('subtitle')}</p>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-md p-6 space-y-4 shadow-sm"
      >
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={submitting}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">{t('newPassword')}</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground">{t('hintMinLength')}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={submitting}
          />
        </div>

        {error && (
          <div className="text-sm text-danger-fg bg-danger-bg border border-danger-fg/20 rounded-md p-2.5">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-success-fg bg-success-bg border border-success-fg/20 rounded-md p-2.5">
            {t('successMessage')}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('submitting')}
              </>
            ) : (
              t('submit')
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => router.push('/suppliers')}
          >
            {t('cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
