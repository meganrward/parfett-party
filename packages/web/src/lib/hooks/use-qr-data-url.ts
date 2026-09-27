import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function useQrDataUrl(value: string, size: number): string | null {
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
