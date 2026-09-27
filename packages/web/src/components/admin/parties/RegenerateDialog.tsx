import { Button, Heading, Stack } from '@parfett/design-system';

// ---------------------------------------------------------------------------
// S3b — regenerate dialog
// ---------------------------------------------------------------------------

export function RegenerateDialog({
  unusedCount,
  batchSize,
  busy,
  onCancel,
  onConfirm,
}: {
  unusedCount: number;
  batchSize: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Regenerate unused codes?"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(29, 27, 24, 0.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--pf-space-4)',
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: 520,
          maxWidth: '100%',
          background: 'var(--pf-color-surface)',
          borderRadius: 'var(--pf-radius-lg)',
          boxShadow: '0 20px 48px rgba(29, 27, 24, 0.28)',
          padding: 'var(--pf-space-5)',
        }}
      >
        <Stack gap={3}>
          <Heading level={2}>Regenerate unused codes?</Heading>
          <p style={{ margin: 0, color: 'var(--pf-color-text)' }}>
            This deletes the <strong>{unusedCount} codes nobody has scanned yet</strong> and makes a
            fresh batch of {batchSize}. Cards already handed out keep working, but any unused cards
            you&apos;ve printed become dead.
          </p>
          <Stack direction="row" gap={2} justify="flex-end">
            <Button variant="secondary" disabled={busy} onClick={onCancel}>
              Keep them
            </Button>
            <Button variant="danger" disabled={busy} onClick={onConfirm}>
              Delete {unusedCount} and regenerate
            </Button>
          </Stack>
        </Stack>
      </div>
    </div>
  );
}
