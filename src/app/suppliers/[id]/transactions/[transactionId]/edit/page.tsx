import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { FormPage } from '@/components/forms/form-page';
import { TransactionForm, type TransactionFormInitialData } from '../../_components/TransactionForm';
import { FileUploader } from '../../../_components/file-uploader';
import { TransactionDocList } from '../../../_components/transaction-doc-list';
import { DetailSection } from '../../../_components/detail-section';
import { PaymentScreenshotsSection } from '../../../_components/payment-screenshots-section';

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string; transactionId: string }>;
}) {
  const { id: idStr, transactionId: txIdStr } = await params;
  const supplierId = parseInt(idStr, 10);
  const transactionId = parseInt(txIdStr, 10);
  if (isNaN(supplierId) || isNaN(transactionId)) notFound();

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      transactionItems: { orderBy: { sortOrder: 'asc' } },
      payments: {
        orderBy: { paidAt: 'asc' },
        include: {
          files: {
            where: { type: 'PAYMENT_SCREENSHOT', isActive: true },
            select: {
              id: true,
              fileName: true,
              mimeType: true,
              sizeBytes: true,
              thumbnailKey: true,
              titleZh: true,
              titleRu: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });
  if (!tx) notFound();
  if (tx.supplierId !== supplierId) {
    redirect(`/suppliers/${tx.supplierId}/transactions/${transactionId}/edit`);
  }

  const [availableContacts, availableQuotes, transactionDocs, tFiles] = await Promise.all([
    prisma.contact.findMany({
      where: { supplierId, status: 'ACTIVE' },
      select: { id: true, nameZh: true },
      orderBy: { isPrimary: 'desc' },
    }),
    prisma.quote.findMany({
      where: { supplierId, status: 'ACTIVE' },
      select: {
        id: true, productNameZh: true, quotedAt: true,
        unitPrice: true, currency: true,
      },
      orderBy: { quotedAt: 'desc' },
    }),
    prisma.file.findMany({
      where: { transactionId, type: 'TRANSACTION_DOC', isActive: true },
      select: {
        id: true, fileName: true, mimeType: true, sizeBytes: true,
        titleZh: true, titleRu: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    getTranslations('files'),
  ]);

  const initialData: TransactionFormInitialData = {
    id: tx.id,
    contactId: tx.contactId,
    orderedAt: tx.orderedAt.toISOString().slice(0, 10),
    totalAmount: tx.totalAmount.toString(),
    currency: tx.currency,
    notesZh: tx.notesZh,
    notesRu: tx.notesRu,
    notesRuAutoTranslated: tx.notesRuAutoTranslated,
    status: tx.status,
    items: tx.transactionItems.map((it) => ({
      quoteId: it.quoteId,
      productNameZh: it.productNameZh,
      productNameRu: it.productNameRu,
      productNameRuAutoTranslated: it.productNameRuAutoTranslated,
      productSpecZh: it.productSpecZh,
      productSpecRu: it.productSpecRu,
      productSpecRuAutoTranslated: it.productSpecRuAutoTranslated,
      quantity: it.quantity,
      unitZh: it.unitZh,
      unitRu: it.unitRu,
      unitPrice: it.unitPrice.toString(),
      subtotal: it.subtotal.toString(),
      sortOrder: it.sortOrder,
    })),
    // 关键改动:把 p.id 带进 initialData
    payments: tx.payments.map((p) => ({
      id: p.id,
      paidAt: p.paidAt.toISOString().slice(0, 10),
      amount: p.amount.toString(),
      currency: p.currency,
      method: p.method,
      purposeZh: p.purposeZh,
      purposeRu: p.purposeRu,
      purposeRuAutoTranslated: p.purposeRuAutoTranslated,
    })),
  };

  return (
    <FormPage
      title={`编辑订单 #${tx.id}`}
      backHref={`/suppliers/${supplierId}`}
      backLabel="返回供应商详情"
      maxWidthClass="max-w-5xl"
    >
      <TransactionForm
        supplierId={supplierId}
        initialData={initialData}
        availableContacts={availableContacts}
        availableQuotes={availableQuotes.map((q) => ({
          ...q,
          unitPrice: q.unitPrice.toString(),
        }))}
      />

      <div className="mt-8">
        <DetailSection title={tFiles('transactionDocsTitle')}>
          <FileUploader
            ownerId={transactionId}
            type="TRANSACTION_DOC"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            maxBytes={30 * 1024 * 1024}
            label={tFiles('uploadTransactionDocs')}
            acceptHint={tFiles('transactionDocAcceptHint')}
          />
          <TransactionDocList supplierId={supplierId} items={transactionDocs} />
        </DetailSection>
      </div>

      {/* 付款凭证(每条 Payment 一个独立的截图管理区) */}
      <div className="mt-8">
        <DetailSection title={tFiles('paymentScreenshotsTitle')}>
          <PaymentScreenshotsSection
            supplierId={supplierId}
            payments={tx.payments}
          />
        </DetailSection>
      </div>
    </FormPage>
  );
}