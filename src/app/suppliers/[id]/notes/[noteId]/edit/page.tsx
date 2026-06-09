import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { NoteForm, type NoteFormInitialData } from '../../_components/NoteForm';

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

  const [availableContacts, availableQuotes] = await Promise.all([
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
  ]);

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
    <div className="p-6">
      <Link href={`/suppliers/${supplierId}`} className="text-sm text-blue-600 hover:underline">
        ← 返回供应商详情
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">编辑沟通记录 #{note.id}</h1>
      <NoteForm
        supplierId={supplierId}
        initialData={initialData}
        availableContacts={availableContacts}
        availableQuotes={availableQuotes}
      />
    </div>
  );
}