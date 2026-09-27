import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Heading, Stack } from '@parfett/design-system';
import { onlyUnusedCodes } from '../../../lib/hooks/admin-guests';
import * as api from '../../../lib/supabase/api';
import type { GenerateQrCodesResult, Party } from '../../../lib/supabase/api-types';
import { RegenerateDialog } from './RegenerateDialog';
import { muted, mono } from './styles';

// ---------------------------------------------------------------------------
// S2 QR panel
// ---------------------------------------------------------------------------

export function GeneratePanel({
  party,
  onGenerated,
  showCodeSheetLink = true,
}: {
  party: Party;
  /** Called after a successful generate/regenerate, so a caller can refresh its own code list. */
  onGenerated?: () => void;
  /** Hide when this panel is already shown on the code sheet page itself. */
  showCodeSheetLink?: boolean;
}) {
  const [busy, setBusy] = useState<null | 'append' | 'regenerate-unused'>(null);
  const [result, setResult] = useState<GenerateQrCodesResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [unusedCount, setUnusedCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const codes = await api.listQrCodesWithGuests(party.id);
        if (active) {
          setUnusedCount(onlyUnusedCodes(codes).length);
        }
      } catch {
        // leave the count at 0 — the dialog still works
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [party.id, result]);

  const run = async (mode: 'append' | 'regenerate-unused') => {
    setConfirming(false);
    setBusy(mode);
    setError(null);
    setResult(null);
    try {
      setResult(await api.invokeGenerateQrCodes({ partyId: party.id, mode }));
      onGenerated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card padding={5}>
      <Stack gap={3}>
        <Heading level={3}>QR codes</Heading>
        <Stack direction="row" gap={4} wrap>
          <span style={mono}>{party.qrCount} target</span>
          <span style={muted}>{unusedCount} unused</span>
          <span style={muted}>{party.prefixes.length || 'no'} prefixes</span>
        </Stack>
        <Stack direction="row" gap={3} wrap>
          <Button disabled={busy !== null} onClick={() => void run('append')}>
            {busy === 'append' ? 'Generating…' : `Generate ${party.qrCount}`}
          </Button>
          <Button variant="secondary" disabled={busy !== null} onClick={() => setConfirming(true)}>
            Regenerate unused
          </Button>
          {showCodeSheetLink ? (
            <Link
              className="pf-button pf-button--ghost pf-button--md"
              to={`/admin/${party.slug}/codes`}
            >
              Open code sheet
            </Link>
          ) : null}
        </Stack>
        {error ? <span style={{ color: 'var(--pf-color-danger)' }}>{error}</span> : null}
        {result ? (
          <span style={muted}>
            Made {result.count} code{result.count === 1 ? '' : 's'}
            {result.deleted ? `, removed ${result.deleted} unused` : ''}.
          </span>
        ) : null}
      </Stack>

      {confirming ? (
        <RegenerateDialog
          unusedCount={unusedCount}
          batchSize={party.qrCount}
          busy={busy !== null}
          onCancel={() => setConfirming(false)}
          onConfirm={() => void run('regenerate-unused')}
        />
      ) : null}
    </Card>
  );
}
