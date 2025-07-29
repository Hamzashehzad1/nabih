import { NabihIcon } from './nabih-icon';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <NabihIcon className="h-7 w-7 text-primary" />
      <span className="text-xl font-headline font-bold">Nabih</span>
    </div>
  );
}
