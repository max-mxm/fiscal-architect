import React, { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '~/utils';

interface FieldProps {
  label: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  adornment?: ReactNode;
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode;
  className?: string;
}

/** Libellé + contrôle + aide/erreur, câblés pour l'accessibilité. */
export function Field({ label, help, error, adornment, children, className }: FieldProps) {
  const inputId = useId();
  const helpId = useId();
  const errorId = useId();
  const describedBy = [help ? helpId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center gap-1.5">
        <label htmlFor={inputId} className="text-[14px] font-semibold text-ink">
          {label}
        </label>
        {adornment}
      </div>
      {children({ inputId, describedBy })}
      {error && (
        <p id={errorId} role="alert" className="text-[13px] font-medium text-alert-ink">
          {error}
        </p>
      )}
      {help && (
        <p id={helpId} className="text-[13px] leading-snug text-ink-2 text-pretty">
          {help}
        </p>
      )}
    </div>
  );
}

const inputBase =
  'h-11 w-full rounded-[var(--radius-ctl)] border border-line-3 bg-card px-3 text-[15px] text-ink placeholder:text-ink-3 ' +
  'transition-colors hover:border-ink-3 focus:border-primary focus:outline-none focus-visible:outline-none focus:ring-3 focus:ring-primary/20 ' +
  'disabled:cursor-not-allowed disabled:bg-card-2 disabled:text-ink-3 aria-[invalid=true]:border-alert';

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cn(inputBase, className)} {...rest} />;
});

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  suffix?: ReactNode;
  /** Classes du champ lui-même ; `className` dimensionne le conteneur (et donc le suffixe). */
  inputClassName?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { className, inputClassName, suffix, ...rest },
  ref,
) {
  return (
    <div className={cn('relative', className)}>
      <input
        ref={ref}
        type="number"
        inputMode="decimal"
        className={cn(inputBase, 'text-[16px] font-semibold tnum', suffix ? 'pr-12' : '', inputClassName)}
        {...rest}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[14px] font-medium text-ink-2">
          {suffix}
        </span>
      )}
    </div>
  );
});

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function SelectInput(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(inputBase, 'appearance-none pr-10', className)} {...rest}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-2"
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </div>
  );
});
