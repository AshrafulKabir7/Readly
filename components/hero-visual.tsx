'use client';

import { useEffect, useState } from 'react';
import { Check, ScanLine, Sparkles } from 'lucide-react';

/*
 * Boxes are where the real pipeline located each value on
 * /samples/brightwave-photo.jpg (percent of the image). The photo is rotated
 * about -2.4°, so the highlights are rotated to match.
 */
const fields = [
  { label: 'Vendor', value: 'Brightwave Digital Ltd', confidence: 94, box: { x: 11.4, y: 11.3, w: 34.4, h: 3.2 } },
  { label: 'Invoice number', value: 'BW-10427', confidence: 92, box: { x: 70.4, y: 12.9, w: 18.2, h: 1.9 } },
  { label: 'Invoice date', value: 'September 3, 2026', confidence: 96, box: { x: 68.6, y: 14.5, w: 20.2, h: 1.9 } },
  { label: 'Line items', value: '3 rows · match subtotal', confidence: 89, box: { x: 12.6, y: 30.4, w: 76.6, h: 10.4 } },
  { label: 'Total due', value: '£3,672.00', confidence: 93, box: { x: 72.8, y: 43.3, w: 17.2, h: 2 } },
];

export function HeroVisual() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % fields.length), 2200);
    return () => window.clearInterval(timer);
  }, [paused]);

  const current = fields[active];

  return (
    <div className="relative mx-auto w-full max-w-[620px] lg:mx-0" onMouseLeave={() => setPaused(false)}>
      <div className="absolute -inset-8 -z-10 rounded-[48px] bg-[radial-gradient(circle_at_60%_35%,rgba(91,94,240,0.22),transparent_62%)] blur-2xl" />

      <div className="overflow-hidden rounded-[26px] border border-black/[0.06] bg-[#5d5548] shadow-[0_40px_90px_rgba(21,27,44,0.22)]">
        <div className="relative aspect-[1400/1080] overflow-hidden">
          <div className="absolute inset-x-0 top-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/samples/brightwave-photo.jpg"
              alt="An invoice captured on a phone, with the extracted values outlined"
              className="block h-auto w-full"
              width={1400}
              height={1750}
            />
            {fields.map((field, index) => (
              <div
                key={field.label}
                aria-hidden
                className={`absolute rounded-[4px] border-2 transition-all duration-500 ${
                  index === active
                    ? 'border-[#5b5ef0] bg-[#5b5ef0]/18 opacity-100 shadow-[0_0_0_6px_rgba(91,94,240,0.18)]'
                    : 'border-[#5b5ef0]/40 bg-transparent opacity-60'
                }`}
                style={{
                  left: `${field.box.x}%`,
                  top: `${field.box.y}%`,
                  width: `${field.box.w}%`,
                  height: `${field.box.h}%`,
                  transform: 'rotate(-2.4deg)',
                }}
              />
            ))}
          </div>
          <div className="hero-scan-line pointer-events-none absolute inset-x-0 h-0.5 bg-[#8b8dff] shadow-[0_0_18px_4px_rgba(139,141,255,0.55)]" />
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-[#151b2c]/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            <Sparkles className="size-3.5 text-[#b4b6ff]" /> Levelled 2.5° · table rules removed
          </div>
        </div>
      </div>

      <div className="hero-float-card relative -mt-10 ml-auto mr-2 w-[min(330px,92%)] sm:-mt-24 rounded-[20px] border border-white/70 bg-white/95 p-4 shadow-[0_24px_60px_rgba(21,27,44,0.18)] backdrop-blur sm:-mr-6">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#151b2c]">
            <span className="grid size-6 place-items-center rounded-lg bg-[#5b5ef0] text-white">
              <ScanLine className="size-3.5" />
            </span>
            Extracted
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <Check className="size-3" /> 4/4 checks
          </span>
        </div>
        <ul className="mt-3 space-y-1">
          {fields.map((field, index) => (
            <li key={field.label}>
              <button
                type="button"
                onMouseEnter={() => {
                  setPaused(true);
                  setActive(index);
                }}
                onFocus={() => {
                  setPaused(true);
                  setActive(index);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-[10px] px-2.5 py-1.5 text-left transition ${
                  index === active ? 'bg-[#f0f0ff]' : 'hover:bg-[#f6f7fb]'
                }`}
              >
                <span className="text-xs text-[#667085]">{field.label}</span>
                <span className="flex items-center gap-2 truncate text-[13px] font-medium text-[#151b2c]">
                  {field.value}
                  <span className={`size-1.5 shrink-0 rounded-full ${field.confidence >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 px-2.5 text-[11px] text-[#98a2b3]" aria-live="polite">
          {current.label} read at {current.confidence}% confidence
        </p>
      </div>
    </div>
  );
}
