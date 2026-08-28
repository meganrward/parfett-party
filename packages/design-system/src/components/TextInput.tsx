import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId } from 'react';
import { classNames } from './classNames';
import './TextInput.css';

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: ReactNode;
  id?: string;
  hint?: ReactNode;
  error?: ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, id, hint, error, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="pf-field">
      <label className="pf-field__label" htmlFor={inputId}>
        {label}
      </label>
      {hint ? (
        <span className="pf-field__hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={classNames('pf-input', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <span className="pf-field__error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
});
