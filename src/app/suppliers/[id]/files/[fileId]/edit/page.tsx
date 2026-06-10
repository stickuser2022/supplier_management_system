import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { FileEditForm } from './file-edit-form';

export default async function FileEditPage({
  params,
}: {
  params: Promise<{ id: string; fileId: string }>;
}) {
  const { id: idStr, fileId: fileIdStr } = await params;
  const supplierId = parseInt(idStr, 10);
  const fileId = parseInt(fileIdStr, 10);
  if (isNaN(supplierId) || isNaN(fileId)) notFound();

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      fileName: true,
      titleZh: true,
      titleRu: true,
      titleRuAutoTranslated: true,
      supplierId: true,
    },
  });

  if (!file) notFound();
  // 防御:URL 拼错时(fileId 对但 supplierId 不对)重定向回真的归属
  if (file.supplierId !== supplierId) {
    if (file.supplierId) redirect(`/suppliers/${file.supplierId}/files/${fileId}/edit`);
    else notFound();
  }

  const tFiles = await getTranslations('files');

  return (
    <div className="p-6 max-w-2xl">
      <Link
        href={`/suppliers/${supplierId}`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← {tFiles('backToSupplier')}
      </Link>

      <h1 className="text-2xl font-bold mt-2 mb-1">
        {tFiles('editTitleHeading')}
      </h1>
      <p className="text-sm text-gray-500 mb-6 break-all font-mono">
        {file.fileName}
      </p>

      <FileEditForm
        fileId={file.id}
        supplierId={supplierId}
        initialTitleZh={file.titleZh ?? ''}
        initialTitleRu={file.titleRu ?? ''}
        initialAutoTranslated={file.titleRuAutoTranslated}
      />
    </div>
  );
}