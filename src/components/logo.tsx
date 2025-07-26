import { ContentForgeIcon } from './content-forge-icon';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ContentForgeIcon className="h-7 w-7 text-primary" />
      <span className="text-xl font-headline font-bold">Content Forge</span>
    </div>
  );
}
