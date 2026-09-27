import { Fragment } from 'react';
import { inviteUrl } from '../../../lib/utils/invite-url';
import type { DuplexPage } from '../../../lib/utils/duplex-print';
import type { QrCodeWithGuests } from '../../../lib/supabase/api-types';
import { BusinessCard } from './BusinessCard';
import { BusinessCardBack } from './BusinessCardBack';

function BlankSlot({ widthMm, heightMm }: { widthMm: number; heightMm: number }) {
  return (
    <div
      className="pf-bcard pf-bcard--blank"
      style={{ width: `${widthMm}mm`, height: `${heightMm}mm` }}
    />
  );
}

/** Front/back page pairs, laid out so double-sided printing lines the cards up. */
export function DuplexPrintPages({
  slug,
  pages,
  columns,
  widthMm,
  heightMm,
  frontArt,
  frontRatio,
  placement,
  backArt,
}: {
  slug: string;
  pages: Array<DuplexPage<QrCodeWithGuests>>;
  columns: number;
  widthMm: number;
  heightMm: number;
  frontArt: string;
  frontRatio: number;
  placement: Parameters<typeof BusinessCard>[0]['placement'];
  backArt: string;
}) {
  const gridStyle = { gridTemplateColumns: `repeat(${columns}, ${widthMm}mm)` };

  return (
    <div className="pf-duplex-pages">
      {pages.map((page, pageIndex) => (
        <Fragment key={pageIndex}>
          <div className="pf-bcard-page" style={gridStyle}>
            {page.front.map((code, slot) =>
              code ? (
                <BusinessCard
                  key={code.id}
                  artUrl={frontArt}
                  ratio={frontRatio}
                  qrValue={inviteUrl(slug, code.token)}
                  placement={placement}
                  widthMm={widthMm}
                />
              ) : (
                <BlankSlot key={`blank-${slot}`} widthMm={widthMm} heightMm={heightMm} />
              ),
            )}
          </div>
          <div className="pf-bcard-page pf-bcard-page--back" style={gridStyle}>
            {page.back.map((code, slot) =>
              code ? (
                <BusinessCardBack
                  key={code.id}
                  artUrl={backArt}
                  widthMm={widthMm}
                  heightMm={heightMm}
                />
              ) : (
                <BlankSlot key={`blank-${slot}`} widthMm={widthMm} heightMm={heightMm} />
              ),
            )}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
