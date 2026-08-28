import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('associates the label with the input', () => {
    render(<TextInput label="Nickname" />);
    expect(screen.getByLabelText('Nickname')).toBeInstanceOf(HTMLInputElement);
  });

  it('wires hint and error into aria-describedby and sets aria-invalid', () => {
    render(<TextInput label="Code" hint="4 letters" error="Not found" />);
    const input = screen.getByLabelText('Code');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ')).toHaveLength(2);
    expect(screen.getByRole('alert')).toHaveTextContent('Not found');
  });

  it('accepts typed input', async () => {
    render(<TextInput label="Code" />);
    await userEvent.type(screen.getByLabelText('Code'), 'JX4K');
    expect(screen.getByLabelText('Code')).toHaveValue('JX4K');
  });

  it('has no axe violations', async () => {
    const { container } = render(<TextInput label="Code" hint="help" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
