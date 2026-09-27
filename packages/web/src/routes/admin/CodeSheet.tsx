import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Checkbox, Heading, Stack } from '@parfett/design-system';
import { groupCodesByPrefix, onlyUnusedCodes, useAdminParty } from '../../lib/hooks/admin-guests';
import { handedOutByLabel } from '../../lib/utils/prefixes';
import { inviteUrl } from '../../lib/utils/invite-url';
import { readImageFile, useCardArt } from '../../lib/hooks/card-art';
import { BusinessCard, PlacementEditor, QrImage } from '../../components/admin/code-sheet';
import { Page } from '../../components/admin/shared';
import './CodeSheet.css';

/** Standard business-card width; height comes from the artwork's aspect ratio. */
const CARD_WIDTH_MM = 85;

export function CodeSheet() {
  const slug = useParams().slug ?? '';
  const state = useAdminParty(slug);
  const cardArt = useCardArt(slug);
  const fileRef = useRef<HTMLInputElement>(null);
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const groups = useMemo(() => {
    const shown = unusedOnly ? onlyUnusedCodes(state.codes) : state.codes;
    return groupCodesByPrefix(shown);
  }, [state.codes, unusedOnly]);

  const onPickFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setNote(null);
    try {
      const { dataUrl, ratio } = await readImageFile(file);
      const persisted = cardArt.setArt(dataUrl, ratio);
      if (!persisted) {
        setNote('Loaded for this session only — the image is too large to remember.');
      }
    } catch {
      setNote('Could not read that image. Try a PNG or JPEG.');
    }
  };

  if (state.loading) {
    return <Page maxWidth={960}>Loading codes…</Page>;
  }
  if (state.notFound) {
    return <Page maxWidth={960}>That party doesn&apos;t exist.</Page>;
  }
  if (state.error) {
    return (
      <Page maxWidth={960}>
        <Stack gap={3}>
          <span>{state.error}</span>
          <Button variant="secondary" onClick={() => void state.reload()}>
            Try again
          </Button>
        </Stack>
      </Page>
    );
  }

  const hasArt = cardArt.art !== null;
  const firstCode = groups.flatMap((g) => g.codes)[0];

  return (
    <main className="pf-code-sheet">
      <div className="pf-code-sheet__toolbar pf-no-print">
        <Heading level={1}>{state.party?.name} — codes</Heading>
        <Link className="pf-button pf-button--secondary pf-button--sm" to={`/admin/${slug}/guests`}>
          Guests
        </Link>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg"
          style={{ display: 'none' }}
          onChange={(e) => void onPickFile(e.target.files?.[0])}
        />
        <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
          {hasArt ? 'Replace card design' : 'Upload card design'}
        </Button>
        {hasArt ? (
          <Button size="sm" variant="ghost" onClick={() => cardArt.clear()}>
            Remove card design
          </Button>
        ) : null}
        <Checkbox
          label="Unused codes only"
          checked={unusedOnly}
          onChange={(e) => setUnusedOnly(e.target.checked)}
        />
        <Button size="sm" onClick={() => window.print()}>
          Print
        </Button>
      </div>

      {note ? (
        <p className="pf-no-print" style={{ color: 'var(--pf-color-text-muted)' }}>
          {note}
        </p>
      ) : null}

      {hasArt && firstCode ? (
        <div className="pf-code-sheet__setup pf-no-print">
          <Stack gap={2}>
            <Heading level={3}>QR position</Heading>
            <p style={{ margin: 0, color: 'var(--pf-color-text-muted)' }}>
              Drag the QR onto the white space; drag its corner to resize. Every card uses this
              spot.
            </p>
            <PlacementEditor
              artUrl={cardArt.art!}
              ratio={cardArt.ratio}
              qrValue={inviteUrl(slug, firstCode.token)}
              placement={cardArt.placement}
              onChange={cardArt.setPlacement}
            />
          </Stack>
        </div>
      ) : null}

      {groups.length === 0 ? (
        <p style={{ color: 'var(--pf-color-text-muted)' }}>No codes to show.</p>
      ) : null}

      {groups.map(({ prefix, codes }) => (
        <section key={prefix || 'none'} style={{ marginBottom: 'var(--pf-space-6)' }}>
          <Heading level={3} className="pf-no-print">
            {prefix ? handedOutByLabel(prefix) : 'No prefix'} · {codes.length}
          </Heading>
          <div className={hasArt ? 'pf-bcard-grid' : 'pf-code-grid'}>
            {codes.map((code) =>
              hasArt ? (
                <BusinessCard
                  key={code.id}
                  artUrl={cardArt.art!}
                  ratio={cardArt.ratio}
                  qrValue={inviteUrl(slug, code.token)}
                  placement={cardArt.placement}
                  widthMm={CARD_WIDTH_MM}
                />
              ) : (
                <div key={code.id} className="pf-code-card">
                  <QrImage value={inviteUrl(slug, code.token)} />
                  <code>{code.token}</code>
                </div>
              ),
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
