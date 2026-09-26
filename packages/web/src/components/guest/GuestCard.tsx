import type { ComponentProps } from 'react';
import { Card } from '@parfett/design-system';

/** White card with the invite-card padding — the surface for every guest state. */
export function GuestCard({ children, style, ...rest }: ComponentProps<typeof Card>) {
  return (
    <Card style={{ padding: 20, ...style }} {...rest}>
      {children}
    </Card>
  );
}
