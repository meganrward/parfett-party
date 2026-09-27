import { Heading, Stack } from '@parfett/design-system';
import type { QrPlacement } from '../../../lib/hooks/card-art';
import { BusinessCardBack } from './BusinessCardBack';
import { PlacementEditor } from './PlacementEditor';

/** Drag-to-place QR editor for the front art, with the back art shown alongside it (if any). */
export function QrPositionSetup({
  frontArt,
  frontRatio,
  qrValue,
  placement,
  onPlacementChange,
  backArt,
  widthMm,
  heightMm,
}: {
  frontArt: string;
  frontRatio: number;
  qrValue: string;
  placement: QrPlacement;
  onPlacementChange: (next: QrPlacement) => void;
  backArt: string | null;
  widthMm: number;
  heightMm: number;
}) {
  return (
    <div className="pf-code-sheet__setup pf-no-print">
      <Stack gap={2}>
        <Heading level={3}>QR position</Heading>
        <p style={{ margin: 0, color: 'var(--pf-color-text-muted)' }}>
          Drag the QR onto the white space; drag its corner to resize. Every card uses this spot.
        </p>
        <Stack direction="row" gap={4} wrap>
          <PlacementEditor
            artUrl={frontArt}
            ratio={frontRatio}
            qrValue={qrValue}
            placement={placement}
            onChange={onPlacementChange}
          />
          {backArt ? (
            <BusinessCardBack artUrl={backArt} widthMm={widthMm} heightMm={heightMm} />
          ) : null}
        </Stack>
      </Stack>
    </div>
  );
}
