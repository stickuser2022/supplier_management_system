import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { FormPage } from '@/components/forms/form-page';
import { NoteForm, type NoteFormInitialData } from '../../_components/NoteForm';
import { FileUploader } from '../../../_components/file-uploader';
import { NoteAttachmentList } from '../../../_components/note-attachment-list';
import { DetailSection } from '../../../_components/detail-section';

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string; noteId: string }>;
}) {
  const { id: idStr, noteId: noteIdStr } = await params;
  const supplierId = parseInt(idStr, 10);
  const noteId = parseInt(noteIdStr, 10);
  if (isNaN(supplierId) || isNaN(noteId)) notFound();

  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || note.supplierId !== supplierId) notFound();

  const [availableContacts, availableQuotes, attachments, tFiles] = await Promise.all([
    prisma.contact.findMany({
      where: { supplierId, status: 'ACTIVE' },
      select: { id: true, nameZh: true },
      orderBy: { isPrimary: 'desc' },
    }),
    prisma.quote.findMany({
      where: { supplierId, status: 'ACTIVE' },
      select: { id: true, productNameZh: true, quotedAt: true },
      orderBy: { quotedAt: 'desc' },
    }),
    prisma.file.findMany({
      where: { noteId, type: 'NOTE_ATTACHMENT', isActive: true },
      select: {
        id: true, fileName: true, mimeType: true, sizeBytes: true,
        thumbnailKey: true, titleZh: true, titleRu: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    getTranslations('files'),
  ]);

  const tForm = await getTranslations('formPage');

  const initialData: NoteFormInitialData = {
    id: note.id,
    contactId: note.contactId,
    quoteId: note.quoteId,
    contentZh: note.contentZh,
    contentRu: note.contentRu,
    contentRuAutoTranslated: note.contentRuAutoTranslated,
    happenedAt: note.happenedAt.toISOString().slice(0, 10),
  };

  return (
    <FormPage
      title={tForm('editNote', { id: note.id })}
      backHref={`/suppliers/${supplierId}`}
      backLabel={tForm('backToSupplierDetail')}
      maxWidthClass="max-w-5xl"
    >
      <NoteForm
        supplierId={supplierId}
        initialData={initialData}
        availableContacts={availableContacts}
        availableQuotes={availableQuotes}
      />

      <div className="mt-8">
        <DetailSection title={tFiles('noteAttachmentsTitle')}>
          <FileUploader
            ownerId={noteId}
            type="NOTE_ATTACHMENT"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,audio/*"
            maxBytes={30 * 1024 * 1024}
            label={tFiles('uploadNoteAttachments')}
            acceptHint={tFiles('noteAttachmentAcceptHint')}
          />
          <NoteAttachmentList supplierId={supplierId} items={attachments} />
        </DetailSection>
      </div>
    </FormPage>
  );
}