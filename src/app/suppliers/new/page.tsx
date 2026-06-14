import { FormPage } from '@/components/forms/form-page';
import { SupplierForm } from '../_components/SupplierForm';

export default function NewSupplierPage() {
  return (
    <FormPage
      title="新建供应商"
      backHref="/suppliers"
      backLabel="返回列表"
      maxWidthClass="max-w-5xl"
    >
      <SupplierForm />
    </FormPage>
  );
}