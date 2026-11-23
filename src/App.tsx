import { useCallback, useMemo, useRef, useState } from 'react';
import { VanteCanvas, type StageDomRefs } from './components/VanteCanvas';
import { OverlayModals } from './components/OverlayModals';
import { clamp } from './ribbon/math';
import type { WorkItem } from './ribbon/works';

export default function App() {
  const stageRef = useRef<HTMLElement | null>(null);
  const heroTextRef = useRef<HTMLDivElement | null>(null);
  const l1Ref = useRef<HTMLSpanElement | null>(null);
  const l2Ref = useRef<HTMLElement | null>(null);
  const rightPaneRef = useRef<HTMLDivElement | null>(null);
  const ruleRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLButtonElement | null>(null);
  const nameRef = useRef<HTMLDivElement | null>(null);

  const domRefs: StageDomRefs = useMemo(
    () => ({
      stage: stageRef,
      heroText: heroTextRef,
      l1: l1Ref,
      l2: l2Ref,
      rightPane: rightPaneRef,
      rule: ruleRef,
      hint: hintRef,
      name: nameRef,
    }),
    [],
  );

  const [activeModal, setActiveModal] = useState<'contact' | 'menu' | null>(
    null,
  );
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);

  const jumpToProgress = useCallback((nextP: number) => {
    const track = document.getElementById('track');
    if (!track) return;
    const maxScroll = Math.max(0, track.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: clamp(nextP) * maxScroll,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div id="track">
      <div className="stage-shell">
        <header className="top">
          <button
            type="button"
            className="logo"
            onClick={() => jumpToProgress(0)}
            aria-label="Vante — Back to top"
          >
            <svg viewBox="0 0 22 18" aria-hidden="true">
              <path d="M11 0l11 18h-6.200L11 9.600 6.200 18H0z" />
            </svg>
            Vante
          </button>

          <div className="meta-nav">Studio / Experimental / 2024</div>

          <nav className="acts" aria-label="Primary actions">
            <button type="button" onClick={() => setActiveModal('contact')}>
              لنتحدث
            </button>
            <button type="button" onClick={() => setActiveModal('menu')}>
              Menu
            </button>
          </nav>
        </header>

        <main className="stage" id="stage" ref={stageRef} data-phase="intro">
          <div className="hero-text" ref={heroTextRef}>
            <h1 className="hl" aria-label="Craft in motion">
              <span ref={l1Ref}>Craft In</span>
              <b ref={l2Ref}>Motion</b>
            </h1>
            <div id="cap">
              استكشاف الأفكار من خلال ممارسة التصميم اليومية.
            </div>
          </div>

          <div className="right-pane" ref={rightPaneRef} aria-hidden="true">
            <div className="center-mark" />
          </div>

          <div id="rule" ref={ruleRef} />

          <VanteCanvas
            domRefs={domRefs}
            onSelectWork={(work) => {
              setActiveModal(null);
              setSelectedWork(work);
            }}
          />

          <button
            type="button"
            id="hint"
            ref={hintRef}
            onClick={() => setActiveModal('contact')}
          >
            ابدأ مشروعًا →
          </button>

          <div id="name" ref={nameRef} />
        </main>

        <footer className="bot">
          <p>
            مفاهيم واستكشافات وتجارب واجهة مستخدم نشاركها بانفتاح كجزء من
            عمليتنا الإبداعية.
          </p>
          <div className="mid">
            مرئيات<s>/</s>أفلام<s>/</s>موسيقى<s>/</s>تجارب
          </div>
          <button
            type="button"
            className="r"
            onClick={() => jumpToProgress(0.94)}
          >
            عرض أعمالنا
          </button>
        </footer>

        <div className="credit-bar" aria-label="Design and development credits">
          <span dir="rtl">تم التصميم والتطوير: المهندس عبد الرحمن التمكي</span>
          <span>Designed &amp; Developed by Eng. Abdulrahman Al-Tamaki</span>
          <a
            href="https://wa.me/963980496428"
            target="_blank"
            rel="noopener noreferrer"
            className="wa-link"
            aria-label="WhatsApp 0980496428"
          >
            WhatsApp · 0980496428
          </a>
        </div>
      </div>

      <OverlayModals
        activeModal={activeModal}
        selectedWork={selectedWork}
        onClose={() => {
          setActiveModal(null);
          setSelectedWork(null);
        }}
        onJumpToProgress={jumpToProgress}
        onSelectWork={(work) => {
          setActiveModal(null);
          setSelectedWork(work);
        }}
      />
    </div>
  );
}
