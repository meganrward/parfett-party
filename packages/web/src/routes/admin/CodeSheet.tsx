import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { Button, Checkbox, Heading, Stack } from '@parfett/design-system';
import { groupCodesByPrefix, onlyUnusedCodes, useAdminParty } from '../../lib/admin-guests';
import { handedOutByLabel } from '../../lib/prefixes';
import { inviteUrl } from '../../lib/invite-url';
import {
  movePlacement,
  readImageFile,
  resizePlacement,
  useCardArt,
  type QrPlacement,
} from '../../lib/card-art';
import './CodeSheet.css';

/** Standard business-card width; height comes from the artwork's aspect ratio. */
const CARD_WIDTH_MM = 85;

function useQrDataUrl(value: string, size: number): string | null {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const generate = async () => {
      try {
        const url = await QRCode.toDataURL(value, { width: size, margin: 1 });
        if (active) {
          setSrc(url);
        }
      } catch {
        // leave the placeholder in place
      }
    };
    void generate();
    return () => {
      active = false;
    };
  }, [value, size]);
  return src;
}

function QrImage({ value, size = 140 }: { value: string; size?: number }) {
  const src = useQrDataUrl(value, size);
  if (!src) {
    return (
      <div
        style={{ width: size, height: size, background: 'var(--pf-color-surface-sunken)' }}
        aria-hidden
      />
    );
  }
  return <img src={src} width={size} height={size} alt={`QR code linking to ${value}`} />;
}

function BusinessCard({
  artUrl,
  ratio,
  qrValue,
  placement,
  widthMm,
}: {
  artUrl: string;
  ratio: number;
  qrValue: string;
  placement: QrPlacement;
  widthMm: number;
}) {
  const qr = useQrDataUrl(qrValue, 600);
  return (
    <div className="pf-bcard" style={{ width: `${widthMm}mm`, height: `${widthMm / ratio}mm` }}>
      <img className="pf-bcard__art" src={artUrl} alt="" />
      {qr ? (
        <img
          className="pf-bcard__qr"
          src={qr}
          alt=""
          style={{
            left: `${placement.xPct}%`,
            top: `${placement.yPct}%`,
            width: `${placement.sizePct}%`,
          }}
        />
      ) : null}
    </div>
  );
}

/** The uploaded card with a draggable / resizable QR box over it. */
function PlacementEditor({
  artUrl,
  ratio,
  qrValue,
  placement,
  onChange,
}: {
  artUrl: string;
  ratio: number;
  qrValue: string;
  placement: QrPlacement;
  onChange: (next: QrPlacement) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: 'move' | 'resize'; x: number; y: number; start: QrPlacement } | null>(
    null,
  );
  const qr = useQrDataUrl(qrValue, 600);

  const startDrag = (e: React.PointerEvent, mode: 'move' | 'resize') => {
    e.preventDefault();
    boxRef.current?.setPointerCapture(e.pointerId);
    drag.current = { mode, x: e.clientX, y: e.clientY, start: placement };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!d || !rect || !rect.width || !rect.height) {
      return;
    }
    const dxPct = ((e.clientX - d.x) / rect.width) * 100;
    const dyPct = ((e.clientY - d.y) / rect.height) * 100;
    onChange(
      d.mode === 'move'
        ? movePlacement(d.start, ratio, { dxPct, dyPct })
        : resizePlacement(d.start, ratio, dxPct),
    );
  };

  const endDrag = (e: React.PointerEvent) => {
    boxRef.current?.releasePointerCapture?.(e.pointerId);
    drag.current = null;
  };

  return (
    <div
      ref={frameRef}
      className="pf-bcard pf-placement-frame"
      style={{ width: '85mm', height: `${85 / ratio}mm` }}
    >
      <img className="pf-bcard__art" src={artUrl} alt="" />
      <div
        ref={boxRef}
        className="pf-placement-qr"
        role="group"
        aria-label="Drag to move the QR code; drag the corner to resize"
        style={{
          left: `${placement.xPct}%`,
          top: `${placement.yPct}%`,
          width: `${placement.sizePct}%`,
        }}
        onPointerDown={(e) => startDrag(e, 'move')}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {qr ? <img src={qr} alt="" style={{ width: '100%', display: 'block' }} /> : null}
        <span
          className="pf-placement-handle"
          onPointerDown={(e) => {
            e.stopPropagation();
            startDrag(e, 'resize');
          }}
        />
      </div>
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{ maxWidth: 960, margin: '0 auto', padding: 'var(--pf-space-6) var(--pf-space-5)' }}
    >
      <div style={{ color: 'var(--pf-color-text-muted)' }}>{children}</div>
    </main>
  );
}

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
    return <Page>Loading codes…</Page>;
  }
  if (state.notFound) {
    return <Page>That party doesn&apos;t exist.</Page>;
  }
  if (state.error) {
    return (
      <Page>
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
