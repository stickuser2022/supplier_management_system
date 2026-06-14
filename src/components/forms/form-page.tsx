import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FormPageProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export function FormPage({
  title,
  description,
  backHref,
  backLabel,
  maxWidthClass = 'max-w-3xl',
  children,
}: FormPageProps) {
  return (
    <div className={cn('p-6 mx-auto', maxWidthClass)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="size-4" />
          {backLabel}
        </Link>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}