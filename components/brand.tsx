import { ScanLine } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-[10px] bg-[#36aef5] text-white shadow-[0_7px_18px_rgba(54,174,245,0.24)]">
        <ScanLine className="size-4.5" strokeWidth={2.25} />
      </span>
      <span className="font-heading text-[15px] font-bold tracking-[-0.025em] text-[#111111]">
        LumenDoc{compact ? '' : ' AI'}
      </span>
    </span>
  );
}
