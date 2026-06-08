import { SupplierForm } from '../_components/SupplierForm';

export default function NewSupplierPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">新建供应商</h1>
      <SupplierForm />
    </div>
  );
}