import React, { type ReactNode } from 'react';
import { cn } from '~/utils';

/** Bloc de réglages : un titre, une phrase, puis les contrôles séparés par des filets. */
export function SettingsBlock({
  title,
  description,
  children,
  tone = 'default',
  id,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  tone?: 'default' | 'danger';
  id?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-titre` : undefined}
      className={cn(
        'card',
        tone === 'danger' && 'shadow-[inset_0_0_0_1.5px_var(--color-alert)]',
      )}
    >
      <header className="px-4 pb-1 pt-4 sm:px-5">
        <h2 id={id ? `${id}-titre` : undefined} className={cn('text-[17px] font-bold', tone === 'danger' ? 'text-alert-ink' : 'text-ink')}>
          {title}
        </h2>
        {description && <p className="mt-0.5 text-[14px] leading-snug text-ink-2 text-pretty">{description}</p>}
      </header>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

export function SettingsRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-4 py-4 sm:px-5', className)}>{children}</div>;
}

/** Ligne de statut : une puce d'état et un texte. */
export function StatusNote({
  tone,
  children,
  role = 'status',
}: {
  tone: 'ok' | 'warn' | 'alert' | 'neutral';
  children: ReactNode;
  role?: 'status' | 'alert';
}) {
  return (
    <p
      role={role}
      className={cn(
        'flex items-start gap-2.5 rounded-[var(--radius-ctl)] px-3 py-2.5 text-[14px] leading-snug text-pretty',
        tone === 'ok' && 'bg-net-soft text-ink',
        tone === 'warn' && 'bg-warn-soft text-ink',
        tone === 'alert' && 'bg-alert-soft text-ink',
        tone === 'neutral' && 'bg-card-2 text-ink-2',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
          tone === 'ok' && 'bg-net',
          tone === 'warn' && 'bg-warn',
          tone === 'alert' && 'bg-alert',
          tone === 'neutral' && 'bg-ink-3',
        )}
      />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
