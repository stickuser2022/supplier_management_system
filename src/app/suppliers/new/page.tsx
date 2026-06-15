import { getTranslations } from 'next-intl/server';
import { FormPage } from '@/components/forms/form-page';
import { SupplierForm } from '../_components/SupplierForm';

export default async function NewSupplierPage() {
  const t = await getTranslations('formPage');
  return (
    <FormPage
      title={t('newSupplier')}
      backHref="/suppliers"
      backLabel={t('backToList')}
      maxWidthClass="max-w-5xl"
    >
      <SupplierForm />
    </FormPage>
  );
}
