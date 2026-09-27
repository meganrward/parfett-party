import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Checkbox, Heading, Stack } from '@parfett/design-system';
import { groupCodesByPrefix, onlyUnusedCodes, useAdminParty } from '../../lib/hooks/admin-guests';
import { inviteUrl } from '../../lib/utils/invite-url';
import { readImageFile, useCardArt } from '../../lib/hooks/card-art';
import {
  BusinessCardBack,
  CardBackControls,
  CodeGroups,
  DuplexPrintPages,
  PlacementEditor,
} from '../../components/admin/code-sheet';
import { GeneratePanel } from '../../components/admin/parties';
import { Page } from '../../components/admin/shared';
import { cardsPerPage, paginateForDuplex, type DuplexFlip } from '../../lib/utils/duplex-print';
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
  const [duplexFlip, setDuplexFlip] = useState<DuplexFlip>('long-edge');

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

  const onPickBackFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setNote(null);
    try {
      const { dataUrl, ratio } = await readImageFile(file);
      const persisted = cardArt.setBackArt(dataUrl, ratio);
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
  const hasBackArt = cardArt.backArt !== null;
  const allCodes = groups.flatMap((g) => g.codes);
  const firstCode = allCodes[0];
  const cardHeightMm = CARD_WIDTH_MM / cardArt.ratio;
  const { columns: duplexColumns, rows: duplexRows } = cardsPerPage(CARD_WIDTH_MM, cardHeightMm);
  const duplexPages =
    hasArt && hasBackArt ? paginateForDuplex(allCodes, duplexColumns, duplexRows, duplexFlip) : [];

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
        {hasArt ? (
          <CardBackControls
            hasBackArt={hasBackArt}
            duplexFlip={duplexFlip}
            onPickBackFile={(file) => void onPickBackFile(file)}
            onClearBackArt={() => cardArt.clearBackArt()}
            onDuplexFlipChange={setDuplexFlip}
          />
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

      {state.party ? (
        <div className="pf-no-print" style={{ marginBottom: 'var(--pf-space-5)' }}>
          <GeneratePanel
            party={state.party}
            onGenerated={() => void state.reload()}
            showCodeSheetLink={false}
          />
        </div>
      ) : null}

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
            <Stack direction="row" gap={4} wrap>
              <PlacementEditor
                artUrl={cardArt.art!}
                ratio={cardArt.ratio}
                qrValue={inviteUrl(slug, firstCode.token)}
                placement={cardArt.placement}
                onChange={cardArt.setPlacement}
              />
              {hasBackArt ? (
                <BusinessCardBack
                  artUrl={cardArt.backArt!}
                  widthMm={CARD_WIDTH_MM}
                  heightMm={cardHeightMm}
                />
              ) : null}
            </Stack>
          </Stack>
        </div>
      ) : null}

      {groups.length === 0 ? (
        <p style={{ color: 'var(--pf-color-text-muted)' }}>No codes to show.</p>
      ) : null}

      {hasBackArt ? (
        <DuplexPrintPages
          slug={slug}
          pages={duplexPages}
          columns={duplexColumns}
          widthMm={CARD_WIDTH_MM}
          heightMm={cardHeightMm}
          frontArt={cardArt.art!}
          frontRatio={cardArt.ratio}
          placement={cardArt.placement}
          backArt={cardArt.backArt!}
        />
      ) : (
        <CodeGroups
          slug={slug}
          groups={groups}
          art={cardArt.art}
          ratio={cardArt.ratio}
          placement={cardArt.placement}
          widthMm={CARD_WIDTH_MM}
        />
      )}
    </main>
  );
}
