import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { classNames } from './classNames';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, type = 'button', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={classNames(
        'pf-button',
        `pf-button--${variant}`,
        `pf-button--${size}`,
        fullWidth && 'pf-button--full',
        className,
      )}
      {...rest}
    />
  );
});
