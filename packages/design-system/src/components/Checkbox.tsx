import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId } from 'react';
import { classNames } from './classNames';
import './Checkbox.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  label: ReactNode;
  id?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, id, className, disabled, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label
      className={classNames('pf-checkbox', disabled && 'pf-checkbox--disabled', className)}
      htmlFor={inputId}
    >
      <input ref={ref} id={inputId} type="checkbox" disabled={disabled} {...rest} />
      <span>{label}</span>
    </label>
  );
});
