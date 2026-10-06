'use client';

import { useState } from 'react';
import { MoveHorizontal } from 'lucide-react';

/** Before/after view of the clean-up pass that runs on photographed invoices. */
export function CleanCompare() {
  const [split, setSplit] = useState(52);

  return (
    <div className="relative select-none overflow-hidden rounded-[24px] border border-black/[0.06] bg-[#5d5548] shadow-[0_30px_70px_rgba(21,27,44,0.16)]">
      <div className="relative aspect-[1400/1100]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/samples/brightwave-cleaned.jpg"
          alt="The same invoice after levelling, shadow removal and table-rule removal"
          className="absolute inset-0 h-auto w-full"
        />
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/samples/brightwave-photo.jpg"
            alt="The original invoice as captured on a phone"
            className="absolute inset-0 h-auto w-full"
          />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" style={{ left: `${split}%` }}>
          <span className="absolute top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#151b2c] shadow-lg">
            <MoveHorizontal className="size-4" />
          </span>
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-[#151b2c]/80 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          Phone photo
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-[#5b5ef0] px-3 py-1 text-xs font-medium text-white">
          What OCR reads
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(event) => setSplit(Number(event.target.value))}
          aria-label="Compare the original photo with the cleaned image"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
    </div>
  );
}
