import { useRef } from 'react';
import { useQrDataUrl } from '../../../lib/hooks/use-qr-data-url';
import { movePlacement, resizePlacement, type QrPlacement } from '../../../lib/hooks/card-art';

/** The uploaded card with a draggable / resizable QR box over it. */
export function PlacementEditor({
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
