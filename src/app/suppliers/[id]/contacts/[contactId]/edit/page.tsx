import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ContactForm, type ContactFormInitialData } from '../../_components/ContactForm';

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string; contactId: string }>;
}) {
  const { id: idStr, contactId: contactIdStr } = await params;
  const supplierId = parseInt(idStr, 10);
  const contactId = parseInt(contactIdStr, 10);
  if (isNaN(supplierId) || isNaN(contactId)) notFound();

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact || contact.supplierId !== supplierId) notFound();

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) notFound();

  const initialData: ContactFormInitialData = {
    id: contact.id,
    nameZh: contact.nameZh,
    nameRu: contact.nameRu,
    nameRuAutoTranslated: contact.nameRuAutoTranslated,
    roleZh: contact.roleZh,
    roleRu: contact.roleRu,
    roleRuAutoTranslated: contact.roleRuAutoTranslated,
    phone: contact.phone,
    wechat: contact.wechat,
    email: contact.email,
    whatsapp: contact.whatsapp,
    telegram: contact.telegram,
    qq: contact.qq,
    isPrimary: contact.isPrimary,
  };

  return (
    <div className="p-6">
      <Link href={`/suppliers/${supplierId}`} className="text-sm text-blue-600 hover:underline">
        ← 返回供应商详情
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">编辑「{contact.nameZh}」</h1>
      <ContactForm supplierId={supplierId} initialData={initialData} />
    </div>
  );
}