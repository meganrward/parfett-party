import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl';

const options = [
  { label: 'Going', value: 'going' },
  { label: 'Not going', value: 'not_going' },
] as const;

describe('SegmentedControl', () => {
  it('exposes a radiogroup with the given label and options', () => {
    render(<SegmentedControl label="Coming?" options={options} value={null} onChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup', { name: 'Coming?' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('marks the selected option and reports changes', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl label="Coming?" options={options} value="going" onChange={onChange} />,
    );
    expect(screen.getByRole('radio', { name: 'Going' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Not going' }));
    expect(onChange).toHaveBeenCalledWith('not_going');
  });

  it('does not fire when disabled', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        label="Coming?"
        options={options}
        value={null}
        onChange={onChange}
        disabled
      />,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Going' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <SegmentedControl label="Coming?" options={options} value="going" onChange={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
