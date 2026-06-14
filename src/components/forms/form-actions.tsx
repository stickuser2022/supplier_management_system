interface FormActionsProps {
  children: React.ReactNode;
}

export function FormActions({ children }: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2 pt-4 mt-6 border-t border-border">
      {children}
    </div>
  );
}