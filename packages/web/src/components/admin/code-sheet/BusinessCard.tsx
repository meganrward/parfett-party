import { useQrDataUrl } from '../../../lib/hooks/use-qr-data-url';
import type { QrPlacement } from '../../../lib/hooks/card-art';

export function BusinessCard({
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
