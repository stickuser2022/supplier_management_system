import { getTranslations } from 'next-intl/server';
import { FileUploader } from './file-uploader';
import { PaymentScreenshotsList } from './payment-screenshots-list';

type ScreenshotItem = {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  thumbnailKey: string | null;
  titleZh: string | null;
  titleRu: string | null;
  createdAt: Date;
};

type PaymentWithFiles = {
  id: number;
  paidAt: Date;
  amount: { toString: () => string };
  currency: string;
  method: string | null;
  purposeZh: string | null;
  files: ScreenshotItem[];
};

export async function PaymentScreenshotsSection({
  supplierId,
  payments,
}: {
  supplierId: number;
  payments: PaymentWithFiles[];
}) {
  const tFiles = await getTranslations('files');

  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {tFiles('paymentsEmptyForScreenshots')}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((p) => (
        <div
          key={p.id}
          className="border border-border rounded-md p-4 bg-card space-y-3"
        >
          {/* 付款摘要头 */}
          <div className="flex items-center gap-3 pb-3 border-b border-border text-sm">
            <span className="text-muted-foreground">
              {p.paidAt.toISOString().slice(0, 10)}
            </span>
            <span className="font-mono font-medium text-foreground">
              {p.amount.toString()} {p.currency}
            </span>
            {p.purposeZh && (
              <span className="text-muted-foreground">· {p.purposeZh}</span>
            )}
            {p.method && (
              <span className="text-muted-foreground">· {p.method}</span>
            )}
          </div>

          <FileUploader
            ownerId={p.id}
            type="PAYMENT_SCREENSHOT"
            accept="image/*,application/pdf"
            maxBytes={10 * 1024 * 1024}
            label={tFiles('uploadPaymentScreenshot')}
            acceptHint={tFiles('paymentScreenshotAcceptHint')}
          />

          <PaymentScreenshotsList supplierId={supplierId} items={p.files} />
        </div>
      ))}
    </div>
  );
}