import React from 'react';
import { cn } from '~/utils';

/** Monogramme : une barre d'activité bleue et un CA découpé (net, cotisations, impôt). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#323338" />
      <rect x="6" y="9" width="20" height="4" rx="2" fill="#0073ea" />
      <rect x="6" y="15" width="11" height="8" rx="2" fill="#00c875" />
      <rect x="18.5" y="15" width="3.5" height="8" rx="1.5" fill="#fdab3d" />
      <rect x="23.5" y="15" width="2.5" height="8" rx="1.25" fill="#ff5ac4" />
    </svg>
  );
}
