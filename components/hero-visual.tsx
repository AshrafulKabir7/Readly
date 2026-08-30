'use client';

import { useState, type PointerEvent } from 'react';
import { Check, FileText, ScanLine } from 'lucide-react';

export function HeroVisual() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -5, y: x * 7 });
  }

  return (
    <div
      className="relative min-h-[470px] w-full [perspective:1400px] lg:min-h-[560px]"
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => { setActive(false); setTilt({ x: 0, y: 0 }); }}
      onPointerMove={handlePointerMove}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.055)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_73%)]" />
      <div
        className={`absolute inset-x-2 top-7 mx-auto max-w-[660px] transition-transform duration-300 ease-out [transform-style:preserve-3d] sm:inset-x-8 lg:top-12 ${active ? '' : 'duration-700'}`}
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="relative border border-black/[0.13] bg-[#f1f1ef] p-3 shadow-[0_35px_90px_rgba(0,0,0,0.16)] sm:p-4">
          <div className="flex h-11 items-center justify-between border border-black/[0.08] bg-white px-4">
            <div className="flex items-center gap-2.5"><ScanLine className="size-4 text-[#199fe8]" /><span className="text-[10px] font-medium">Invoice extraction</span></div>
            <span className="font-mono text-[9px] text-[#8a8a8a]">INV-2408-036</span>
          </div>

          <div className="mt-3 grid min-h-[360px] gap-3 md:grid-cols-[0.9fr_1.1fr]">
            <div className="relative overflow-hidden border border-black/[0.08] bg-[#e5e7e8] p-5">
              <div className="mx-auto h-full max-w-[230px] bg-white p-5 shadow-[0_14px_30px_rgba(0,0,0,0.1)]">
                <div className="flex items-start justify-between border-b border-black/[0.1] pb-4"><div><div className="h-2 w-20 bg-[#171717]" /><div className="mt-2 h-1.5 w-12 bg-[#c6c6c6]" /></div><FileText className="size-6 text-[#159fe9]" /></div>
                <div className="mt-5 grid grid-cols-2 gap-4"><div className="space-y-2"><div className="h-1.5 w-12 bg-[#bcbcbc]" /><div className="h-1.5 w-20 bg-[#e0e0e0]" /><div className="h-1.5 w-16 bg-[#e0e0e0]" /></div><div className="space-y-2 text-right"><div className="ml-auto h-1.5 w-10 bg-[#bcbcbc]" /><div className="ml-auto h-1.5 w-16 bg-[#e0e0e0]" /></div></div>
                <div className="mt-7 border border-black/[0.08]"><div className="grid grid-cols-[1fr_34px_48px] bg-[#f2f2f2] p-2"><i className="h-1.5 w-14 bg-[#aaa]" /><i className="h-1.5 w-4 bg-[#aaa]" /><i className="ml-auto h-1.5 w-8 bg-[#aaa]" /></div>{[0,1,2].map((row) => <div key={row} className="grid grid-cols-[1fr_34px_48px] border-t border-black/[0.06] p-2.5"><i className="h-1.5 w-16 bg-[#dedede]" /><i className="h-1.5 w-3 bg-[#dedede]" /><i className="ml-auto h-1.5 w-8 bg-[#c8eaff]" /></div>)}</div>
                <div className="ml-auto mt-5 w-24 space-y-2"><div className="h-1.5 bg-[#e0e0e0]" /><div className="h-2 bg-[#1a1a1a]" /></div>
              </div>
              <div className="hero-scan-line absolute inset-x-3 h-px bg-[#14a7f5] shadow-[0_0_12px_3px_rgba(20,167,245,0.42)]" />
            </div>

            <div className="border border-black/[0.08] bg-white p-5">
              <div className="flex items-start justify-between border-b border-black/[0.08] pb-4"><div><p className="text-[11px] font-medium">Extraction result</p><p className="mt-1 text-[9px] text-[#919191]">Ready for review</p></div><span className="flex items-center gap-1.5 text-[9px] font-medium text-[#1386c4]"><Check className="size-3" /> Complete</span></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <VisualField label="Vendor" value="Northstar Office Supply" />
                <VisualField label="Invoice number" value="INV-2408-036" />
                <VisualField label="Invoice date" value="Aug 14, 2026" />
                <VisualField label="Due date" value="Sep 13, 2026" />
              </div>
              <div className="mt-4 border border-black/[0.08]"><div className="grid grid-cols-[1fr_42px_72px] bg-[#f5f5f3] px-3 py-2 text-[8px] uppercase tracking-[0.1em] text-[#888]"><span>Description</span><span>Qty</span><span className="text-right">Total</span></div>{[['Paper & supplies','2','$1,260'],['Office furniture','1','$2,800'],['Delivery','1','$350']].map((item) => <div key={item[0]} className="grid grid-cols-[1fr_42px_72px] border-t border-black/[0.07] px-3 py-2.5 text-[9px] text-[#5f5f5f]"><span>{item[0]}</span><span>{item[1]}</span><span className="text-right font-medium text-[#222]">{item[2]}</span></div>)}</div>
              <div className="mt-4 flex items-center justify-between bg-[#151515] px-4 py-3 text-white"><div><p className="text-[8px] uppercase tracking-[0.1em] text-white/45">Total</p><p className="mt-1 text-base font-medium">$4,860.00</p></div><span className="bg-[#22aaf3] px-3 py-2 text-[9px] font-medium text-black">Export XLSX</span></div>
            </div>
          </div>
        </div>

        <div className="hero-float-card absolute -bottom-8 -left-4 hidden border border-black/[0.12] bg-white px-4 py-3 shadow-[0_16px_35px_rgba(0,0,0,0.12)] sm:block [transform:translateZ(52px)]">
          <p className="text-[9px] uppercase tracking-[0.12em] text-[#999]">Processing</p><p className="mt-1 text-xs font-medium">2.1 seconds</p>
        </div>
      </div>
    </div>
  );
}

function VisualField({ label, value }: { label: string; value: string }) {
  return <div className="border border-black/[0.08] px-3 py-2.5"><p className="text-[8px] uppercase tracking-[0.11em] text-[#999]">{label}</p><p className="mt-1.5 truncate text-[10px] font-medium text-[#333]">{value}</p></div>;
}
