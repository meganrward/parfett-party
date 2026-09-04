import { useId } from 'react';
import { classNames } from './classNames';
import './SegmentedControl.css';

export interface SegmentedOption<T extends string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  /** Accessible group name; also the radio input `name`. */
  name?: string;
  label: string;
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Stretch to fill its container as an even grid — the mobile / guest size. */
  fullWidth?: boolean;
}

export function SegmentedControl<T extends string>({
  name,
  label,
  options,
  value,
  onChange,
  disabled = false,
  fullWidth = false,
}: SegmentedControlProps<T>) {
  const autoName = useId();
  const groupName = name ?? autoName;
  return (
    <div
      className={classNames('pf-segmented', fullWidth && 'pf-segmented--full')}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option) => (
        <label key={option.value} className="pf-segmented__option">
          <input
            type="radio"
            name={groupName}
            value={option.value}
            checked={value === option.value}
            disabled={disabled || option.disabled}
            onChange={() => onChange(option.value)}
          />
          <span className="pf-segmented__label">{option.label}</span>
        </label>
      ))}
    </div>
  );
}
