import { ReactNode } from 'react';

interface DetailSectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function DetailSection({ title, action, children }: DetailSectionProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <h2 className="text-base font-medium text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}