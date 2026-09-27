import { useRef } from 'react';
import { Button } from '@parfett/design-system';
import type { DuplexFlip } from '../../../lib/utils/duplex-print';

/** Toolbar controls for the optional card-back upload and its duplex-print flip edge. */
export function CardBackControls({
  hasBackArt,
  duplexFlip,
  onPickBackFile,
  onClearBackArt,
  onDuplexFlipChange,
}: {
  hasBackArt: boolean;
  duplexFlip: DuplexFlip;
  onPickBackFile: (file: File | undefined) => void;
  onClearBackArt: () => void;
  onDuplexFlipChange: (flip: DuplexFlip) => void;
}) {
  const backFileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={backFileRef}
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: 'none' }}
        onChange={(e) => onPickBackFile(e.target.files?.[0])}
      />
      <Button size="sm" variant="secondary" onClick={() => backFileRef.current?.click()}>
        {hasBackArt ? 'Replace card back' : 'Upload card back (optional)'}
      </Button>
      {hasBackArt ? (
        <Button size="sm" variant="ghost" onClick={onClearBackArt}>
          Remove card back
        </Button>
      ) : null}
      {hasBackArt ? (
        <label className="pf-code-sheet__duplex">
          Duplex flip
          <select
            value={duplexFlip}
            onChange={(e) => onDuplexFlipChange(e.target.value as DuplexFlip)}
          >
            <option value="long-edge">Long edge (book-style, most printers)</option>
            <option value="short-edge">Short edge (flip on top)</option>
          </select>
        </label>
      ) : null}
    </>
  );
}
