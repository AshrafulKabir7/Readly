'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanLine } from 'lucide-react';

import OcrWorkspace from '@/components/ocr-workspace';

export default function WorkspacePage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem('readly-demo-session');
    if (!session) {
      router.replace('/login');
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8f9]">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-10 place-items-center rounded-xl bg-[#36aef5] text-white shadow-[0_10px_25px_rgba(54,174,245,0.25)]">
            <ScanLine className="size-5 animate-pulse" />
          </span>
          <p className="text-xs font-semibold text-[#777]">Opening your workspace…</p>
        </div>
      </main>
    );
  }

  return <OcrWorkspace />;
}
