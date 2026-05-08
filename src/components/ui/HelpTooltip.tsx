import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle } from 'lucide-react';
import { cn } from '~/utils';
import { FISCAL_GLOSSARY, type FiscalTermId } from '~/lib/fiscalGlossary';

interface HelpTooltipProps {
  termId: FiscalTermId;
  className?: string;
}

const POPOVER_WIDTH = 280;
const GAP = 8;
const VIEWPORT_MARGIN = 8;
const OPEN_EVENT = 'helptooltip:open';

type Pos = { top: number; left: number; placement: 'top' | 'bottom' };

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ termId, className }) => {
  const term = FISCAL_GLOSSARY[termId];
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const computePos = () => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const popHeight = popoverRef.current?.offsetHeight ?? 120;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: 'top' | 'bottom' =
      spaceAbove >= popHeight + GAP + VIEWPORT_MARGIN || spaceAbove >= spaceBelow ? 'top' : 'bottom';
    const centerX = rect.left + rect.width / 2;
    let left = centerX - POPOVER_WIDTH / 2;
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;
    if (left + POPOVER_WIDTH > window.innerWidth - VIEWPORT_MARGIN) {
      left = window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN;
    }
    const top = placement === 'top' ? rect.top : rect.bottom;
    setPos({ top, left, placement });
  };

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    computePos();
    const onResize = () => computePos();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open]);

  useEffect(() => {
    const onOther = (e: Event) => {
      const ev = e as CustomEvent<string>;
      if (ev.detail !== popoverId) setOpen(false);
    };
    window.addEventListener(OPEN_EVENT, onOther as EventListener);
    return () => window.removeEventListener(OPEN_EVENT, onOther as EventListener);
  }, [popoverId]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!open) {
      window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: popoverId }));
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={`Aide : ${term.title}`}
        className={cn(
          'inline-flex items-center justify-center w-5 h-5 shrink-0 rounded-full text-on-surface-variant hover:text-secondary hover:bg-secondary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 transition-colors cursor-help',
          className,
        )}
      >
        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                ref={popoverRef}
                id={popoverId}
                role="tooltip"
                initial={{ opacity: 0, scale: 0.96, y: pos.placement === 'top' ? 4 : -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: pos.placement === 'top' ? 4 : -4 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  ...(pos.placement === 'top'
                    ? { bottom: window.innerHeight - pos.top + GAP }
                    : { top: pos.top + GAP }),
                  left: pos.left,
                  width: POPOVER_WIDTH,
                  transformOrigin: pos.placement === 'top' ? 'bottom center' : 'top center',
                }}
                className="z-[100] bg-surface-lowest border border-outline-variant rounded-xl shadow-xl px-3 py-2.5 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-secondary mb-1">
                  {term.title}
                </p>
                <p className="text-[12px] text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {term.body}
                </p>
                {term.example && (
                  <p className="mt-2 bg-surface-highest/50 rounded-lg px-2 py-1.5 text-[11px] text-on-surface-variant leading-relaxed italic">
                    {term.example}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};
