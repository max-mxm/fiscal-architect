import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { usePrefersReducedMotion } from '~/hooks/usePrefersReducedMotion';
import { cn } from '~/utils';

interface ErrorOrbProps {
  className?: string;
}

const RING_DELAYS = [0, 0.8, 1.6] as const;

/**
 * Orbe central avec icône d'alerte + 3 anneaux concentriques pulsants
 * (effet radar / sonar) + halo flou en arrière-plan. Couleur ambre douce
 * pour signaler un problème sans être agressive.
 *
 * Respecte `prefers-reduced-motion` : l'orbe est rendu statique, sans pulse
 * ni anneaux animés.
 */
export const ErrorOrb: React.FC<ErrorOrbProps> = ({ className }) => {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative w-60 h-60 md:w-80 md:h-80 shrink-0',
        className,
      )}
    >
      {/* Halo flou en arrière-plan */}
      <div className="absolute inset-6 rounded-full bg-amber-500/15 dark:bg-amber-400/15 blur-3xl" />

      {/* Anneaux pulsants (cachés en reduced-motion) */}
      {!reducedMotion && RING_DELAYS.map((delay, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-amber-500/40 dark:border-amber-300/30"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 1.4], opacity: [0.7, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeOut',
            delay,
          }}
        />
      ))}

      {/* Orbe central */}
      <motion.div
        className={cn(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-24 h-24 md:w-32 md:h-32 rounded-full',
          'bg-amber-500/15 dark:bg-amber-400/20',
          'ring-1 ring-amber-500/30 dark:ring-amber-300/40',
          'shadow-[0_0_40px_-8px_rgba(245,158,11,0.4)] dark:shadow-[0_0_60px_-10px_rgba(252,211,77,0.5)]',
          'flex items-center justify-center',
        )}
        animate={reducedMotion ? undefined : { scale: [1, 1.04, 1] }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <AlertTriangle
          className="w-8 h-8 md:w-10 md:h-10 text-amber-600 dark:text-amber-300"
          strokeWidth={2.2}
        />
      </motion.div>
    </div>
  );
};
