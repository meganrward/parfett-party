import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stack } from './Stack';

describe('Stack', () => {
  it('lays out as a flex column by default with a token gap', () => {
    render(<Stack data-testid="s">child</Stack>);
    expect(screen.getByTestId('s')).toHaveStyle({
      display: 'flex',
      'flex-direction': 'column',
      gap: 'var(--pf-space-4)',
    });
  });

  it('honours direction and gap props', () => {
    render(
      <Stack data-testid="s" direction="row" gap={2}>
        child
      </Stack>,
    );
    expect(screen.getByTestId('s')).toHaveStyle({
      'flex-direction': 'row',
      gap: 'var(--pf-space-2)',
    });
  });
});
