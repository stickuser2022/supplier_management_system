import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { FormPage } from '@/components/forms/form-page';
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
    <FormPage
      title={`编辑「${contact.nameZh}」`}
      backHref={`/suppliers/${supplierId}`}
      backLabel="返回供应商详情"
      maxWidthClass="max-w-5xl"
    >
      <ContactForm supplierId={supplierId} initialData={initialData} />
    </FormPage>
  );
}