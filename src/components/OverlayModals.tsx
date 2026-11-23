import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, X } from 'lucide-react';
import { R2_BASE, WORKS, type WorkItem } from '../ribbon/works';

interface OverlayModalsProps {
  activeModal: 'contact' | 'menu' | null;
  selectedWork: WorkItem | null;
  onClose: () => void;
  onJumpToProgress: (p: number) => void;
  onSelectWork: (work: WorkItem) => void;
}

const WHATSAPP_DISPLAY = '0980496428';
const WHATSAPP_URL = 'https://wa.me/963980496428';

export function OverlayModals({
  activeModal,
  selectedWork,
  onClose,
  onJumpToProgress,
  onSelectWork,
}: OverlayModalsProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeModal && !selectedWork) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, selectedWork, onClose]);

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(WHATSAPP_DISPLAY);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (!activeModal && !selectedWork) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        selectedWork
          ? selectedWork.title
          : activeModal === 'contact'
            ? 'Contact Vante Studio'
            : 'Vante Navigation Menu'
      }
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      style={{ backgroundColor: 'rgba(13, 13, 13, 0.94)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {selectedWork ? (
        <div
          className="relative w-full max-w-4xl border p-5 sm:p-7"
          style={{
            backgroundColor: '#0d0d0d',
            borderColor: 'rgba(236, 234, 227, 0.16)',
            color: '#eceae3',
          }}
        >
          <div
            className="mb-4 flex items-start justify-between gap-4 border-b pb-4"
            style={{ borderColor: 'rgba(236, 234, 227, 0.12)' }}
          >
            <div>
              <p
                className="text-xs uppercase tracking-widest"
                style={{ fontFamily: "'Space Mono', monospace", color: '#ff4d00' }}
              >
                0{selectedWork.index + 1} · {selectedWork.category}
              </p>
              <h2
                className="mt-1 text-xl font-extrabold uppercase tracking-tight sm:text-2xl"
                style={{ fontFamily: "'Syne', 'IBM Plex Sans Arabic', sans-serif" }}
              >
                {selectedWork.title} — {selectedWork.titleAr}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="flex h-9 w-9 shrink-0 items-center justify-center border transition-colors hover:bg-[#ff4d00] hover:text-[#0d0d0d] hover:border-[#ff4d00]"
              style={{ borderColor: '#eceae3' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            className="aspect-[16/10] w-full overflow-hidden border"
            style={{
              borderColor: 'rgba(236, 234, 227, 0.12)',
              backgroundColor: '#141414',
            }}
          >
            <video
              key={selectedWork.src}
              src={R2_BASE + selectedWork.src}
              crossOrigin="anonymous"
              muted
              loop
              autoPlay
              playsInline
              controls
              className="h-full w-full object-cover"
            />
          </div>

          <div
            className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs"
            style={{ fontFamily: "'Space Mono', monospace", color: 'rgba(236, 234, 227, 0.65)' }}
          >
            <span>VANTE — CRAFT IN MOTION</span>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-b pb-0.5 text-[#ff4d00]"
              style={{ borderColor: 'rgba(255, 77, 0, 0.5)' }}
            >
              WHATSAPP · {WHATSAPP_DISPLAY}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      ) : activeModal === 'contact' ? (
        <div
          className="relative w-full max-w-xl border p-6 sm:p-8"
          style={{
            backgroundColor: '#0d0d0d',
            borderColor: 'rgba(236, 234, 227, 0.18)',
            color: '#eceae3',
          }}
        >
          <div
            className="mb-6 flex items-center justify-between border-b pb-4"
            style={{ borderColor: 'rgba(236, 234, 227, 0.12)' }}
          >
            <span
              className="text-xs uppercase tracking-widest"
              style={{ fontFamily: "'Space Mono', monospace", color: '#ff4d00' }}
            >
              START A PROJECT · ابدأ مشروعًا
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close contact dialog"
              className="flex h-9 w-9 items-center justify-center border transition-colors hover:bg-[#ff4d00] hover:text-[#0d0d0d] hover:border-[#ff4d00]"
              style={{ borderColor: '#eceae3' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h2
            className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Let&apos;s build something in motion.
          </h2>
          <p
            className="mt-2 text-sm leading-relaxed"
            dir="rtl"
            style={{ color: 'rgba(236, 234, 227, 0.72)' }}
          >
            تواصل معنا مباشرة عبر واتساب لمناقشة تصميم وتطوير واجهات تفاعلية وتجارب بصرية ثلاثية الأبعاد.
          </p>

          <div
            className="mt-6 space-y-4 border-t border-b py-5"
            style={{ borderColor: 'rgba(236, 234, 227, 0.12)' }}
          >
            <div>
              <p
                className="text-xs uppercase"
                style={{ fontFamily: "'Space Mono', monospace", color: '#ff4d00' }}
              >
                DESIGN &amp; DEVELOPMENT
              </p>
              <p className="mt-1 text-base font-semibold">
                Eng. Abdulrahman Al-Tamaki
              </p>
              <p className="mt-0.5 text-sm" dir="rtl">
                تم التصميم والتطوير: المهندس عبد الرحمن التمكي
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div>
                <p
                  className="text-xs uppercase"
                  style={{ fontFamily: "'Space Mono', monospace", color: 'rgba(236, 234, 227, 0.55)' }}
                >
                  WHATSAPP DIRECT
                </p>
                <p
                  className="mt-1 text-lg font-bold tabular-nums"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {WHATSAPP_DISPLAY}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="inline-flex h-10 items-center gap-2 border px-4 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-[#eceae3] hover:text-[#0d0d0d]"
                  style={{ borderColor: '#eceae3' }}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 px-5 text-xs font-extrabold uppercase tracking-wider transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#ff4d00', color: '#0d0d0d' }}
                >
                  Open WhatsApp
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="relative w-full max-w-2xl border p-6 sm:p-8"
          style={{
            backgroundColor: '#0d0d0d',
            borderColor: 'rgba(236, 234, 227, 0.18)',
            color: '#eceae3',
          }}
        >
          <div
            className="mb-6 flex items-center justify-between border-b pb-4"
            style={{ borderColor: 'rgba(236, 234, 227, 0.12)' }}
          >
            <span
              className="text-xs uppercase tracking-widest"
              style={{ fontFamily: "'Space Mono', monospace", color: '#ff4d00' }}
            >
              VANTE · INDEX &amp; CHAPTERS
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="flex h-9 w-9 items-center justify-center border transition-colors hover:bg-[#ff4d00] hover:text-[#0d0d0d] hover:border-[#ff4d00]"
              style={{ borderColor: '#eceae3' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p
                className="mb-3 text-xs uppercase tracking-wider"
                style={{ fontFamily: "'Space Mono', monospace", color: 'rgba(236, 234, 227, 0.55)' }}
              >
                Timeline Chapters
              </p>
              <div
                className="flex flex-col divide-y border-t border-b"
                style={{ borderColor: 'rgba(236, 234, 227, 0.12)' }}
              >
                {[
                  { label: '01. Opening Frame', labelAr: 'الإطار الأول', p: 0 },
                  { label: '02. Title Crossing', labelAr: 'تقاطع العنوان', p: 0.24 },
                  { label: '03. 3D Video Ribbon', labelAr: 'الشريط الحلزوني', p: 0.42 },
                  { label: '04. Selected Works Grid', labelAr: 'شبكة الأعمال', p: 0.94 },
                ].map((chapter) => (
                  <button
                    key={chapter.label}
                    type="button"
                    onClick={() => {
                      onJumpToProgress(chapter.p);
                      onClose();
                    }}
                    className="flex items-center justify-between py-3 text-left text-sm transition-colors hover:text-[#ff4d00]"
                    style={{ borderColor: 'rgba(236, 234, 227, 0.12)' }}
                  >
                    <span>{chapter.label}</span>
                    <span className="text-xs" style={{ color: 'rgba(236, 234, 227, 0.55)' }}>
                      {chapter.labelAr}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p
                className="mb-3 text-xs uppercase tracking-wider"
                style={{ fontFamily: "'Space Mono', monospace", color: 'rgba(236, 234, 227, 0.55)' }}
              >
                Archive (01–06)
              </p>
              <div
                className="flex flex-col divide-y border-t border-b"
                style={{ borderColor: 'rgba(236, 234, 227, 0.12)' }}
              >
                {WORKS.slice(0, 6).map((w) => (
                  <button
                    key={w.src}
                    type="button"
                    onClick={() => onSelectWork(w)}
                    className="flex items-center justify-between py-2.5 text-left text-sm transition-colors hover:text-[#ff4d00]"
                    style={{ borderColor: 'rgba(236, 234, 227, 0.12)' }}
                  >
                    <span>{w.title}</span>
                    <span
                      className="text-xs uppercase"
                      style={{ fontFamily: "'Space Mono', monospace", color: '#ff4d00' }}
                    >
                      {w.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs"
            style={{
              borderColor: 'rgba(236, 234, 227, 0.12)',
              color: 'rgba(236, 234, 227, 0.6)',
              fontFamily: "'Space Mono', 'IBM Plex Sans Arabic', monospace",
            }}
          >
            <div>
              <p className="text-[#eceae3]">تم التصميم والتطوير: المهندس عبد الرحمن التمكي</p>
              <p>Designed &amp; Developed by Eng. Abdulrahman Al-Tamaki</p>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border-b pb-0.5 text-[#ff4d00] tabular-nums"
              style={{ borderColor: 'rgba(255, 77, 0, 0.45)' }}
            >
              WhatsApp · {WHATSAPP_DISPLAY}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
