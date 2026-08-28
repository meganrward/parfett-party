import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('defaults to type="button" and primary/md classes', () => {
    render(<Button>Go</Button>);
    const btn = screen.getByRole('button', { name: 'Go' });
    expect(btn).toHaveAttribute('type', 'button');
    expect(btn).toHaveClass('pf-button', 'pf-button--primary', 'pf-button--md');
  });

  it('applies variant, size and fullWidth modifiers', () => {
    render(
      <Button variant="danger" size="sm" fullWidth>
        X
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveClass(
      'pf-button--danger',
      'pf-button--sm',
      'pf-button--full',
    );
  });

  it('fires onClick when enabled and not when disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Tap</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        Tap
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Button>Accessible</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
