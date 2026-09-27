import { useQrDataUrl } from '../../../lib/hooks/use-qr-data-url';

export function QrImage({ value, size = 140 }: { value: string; size?: number }) {
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
