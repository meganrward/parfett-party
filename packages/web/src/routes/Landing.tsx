import { Link } from 'react-router-dom';
import { Card, Heading, Stack } from '@parfett/design-system';

const muted = { margin: 0, color: 'var(--pf-color-text-muted)' } as const;

export function Landing() {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--pf-space-5)' }}>
      <Card padding={6}>
        <Stack gap={4}>
          <Heading level={1}>Parfett Party</Heading>
          <p style={muted}>
            Scan the QR code on your invite card to let us know if you&apos;re coming and add anyone
            you&apos;re bringing.
          </p>
          <p style={muted}>
            There&apos;s nothing to see on this page — each card has its own link.
          </p>
          <Link className="pf-button pf-button--secondary pf-button--md" to="/admin">
            Host sign in
          </Link>
        </Stack>
      </Card>
    </main>
  );
}
