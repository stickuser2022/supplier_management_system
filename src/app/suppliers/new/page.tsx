import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { FormPage } from '@/components/forms/form-page';
import { SupplierForm } from '../_components/SupplierForm';

export default async function NewSupplierPage() {
  const [t, locale, availableTags] = await Promise.all([
    getTranslations('formPage'),
    getLocale(),
    prisma.tag.findMany({
      where: { isActive: true },
      select: { id: true, nameZh: true, nameRu: true },
      orderBy: [{ category: 'asc' }, { nameZh: 'asc' }],
    }),
  ]);

  return (
    <FormPage
      title={t('newSupplier')}
      backHref="/suppliers"
      backLabel={t('backToList')}
      maxWidthClass="max-w-5xl"
    >
      <SupplierForm
        availableTags={availableTags}
        initialTagIds={[]}
        locale={locale}
      />
    </FormPage>
  );
}
