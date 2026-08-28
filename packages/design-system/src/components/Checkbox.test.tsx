import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders a labelled checkbox', () => {
    render(<Checkbox label="Invite" />);
    expect(screen.getByRole('checkbox', { name: 'Invite' })).toBeInTheDocument();
  });

  it('toggles and calls onChange', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Invite" onChange={onChange} />);
    const box = screen.getByRole('checkbox');
    await userEvent.click(box);
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not toggle when disabled', async () => {
    render(<Checkbox label="Invite" disabled />);
    const box = screen.getByRole('checkbox');
    await userEvent.click(box);
    expect(box).not.toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Checkbox label="Invite" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
