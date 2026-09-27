import { Button, Heading } from '@parfett/design-system';
import { muted } from './styles';

export function DetailEmpty({ onNew }: { onNew: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--pf-space-3)',
        textAlign: 'center',
        padding: 'var(--pf-space-8) var(--pf-space-5)',
        maxWidth: 460,
        margin: '0 auto',
      }}
    >
      <Heading level={2}>Pick a party to manage</Heading>
      <p style={{ ...muted, margin: 0 }}>
        Its details, host access and code generation open here. The slug derives from the name
        unless you set one.
      </p>
      <Button onClick={onNew}>New party</Button>
    </div>
  );
}
