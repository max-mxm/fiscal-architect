import React, { type ReactNode } from 'react';
import { Money } from '~/ui/Money';
import { FAMILY, type Family } from '~/ui/families';
import { cn } from '~/utils';

interface NetBlockProps {
  label: ReactNode;
  value: number;
  /** Part du CA conservée, en %. */
  share?: number | null;
  footer?: ReactNode;
  /** Étiquette posée à côté du montant (ex. « TTC » violet). */
  badge?: ReactNode;
  family?: Family;
  /** Masque le pied sur mobile pour garder la place du contenu suivant. */
  compactFooter?: boolean;
  /** Montant facturé au client : violet TVA quand il est TTC, bleu activité quand il est HT. */
  invoice?: { label: string; amount: number; ttc: boolean } | null;
  className?: string;
}

/** Le chiffre que l'on vient chercher, dans un aplat de sa couleur de famille. */
export function NetBlock({ label, value, share, footer, badge, family = 'net', compactFooter, invoice, className }: NetBlockProps) {
  const negative = value < 0;
  return (
    <section
      className={cn(
        'relative flex flex-col justify-between overflow-hidden rounded-[16px] px-4 py-3.5 lg:p-6',
        negative ? FAMILY.alert.fill : FAMILY[family].fill,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-semibold">{label}</p>
        {share != null && !negative && share > 0 && (
          <span className="shrink-0 rounded-full bg-white/35 px-2.5 py-0.5 text-[13px] font-bold tnum">
            {share.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % du CA
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-3 gap-y-2 md:mt-2">
        <div className="flex items-center gap-3">
          <Money value={value} animate className="block text-[44px] font-extrabold leading-none tracking-[-0.03em] md:text-[60px]" />
          {badge}
        </div>
        {invoice && invoice.amount > 0 && (
          <div
            className={cn(
              'flex shrink-0 flex-col rounded-[12px] px-3 py-1.5 leading-tight shadow-[0_2px_8px_rgb(20_24_52/0.18)]',
              invoice.ttc ? FAMILY.tva.fill : FAMILY.ca.fill,
            )}
          >
            <span className="text-[12px] font-semibold">{invoice.label}</span>
            <span className="text-[17px] font-extrabold tnum">
              <Money value={invoice.amount} animate /> {invoice.ttc ? 'TTC' : 'HT'}
            </span>
          </div>
        )}
      </div>
      {footer && <div className={cn('mt-3 text-[14px] font-medium opacity-90', compactFooter && 'hidden lg:block')}>{footer}</div>}
    </section>
  );
}
