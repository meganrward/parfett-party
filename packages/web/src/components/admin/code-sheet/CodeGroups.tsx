import { Heading } from '@parfett/design-system';
import { inviteUrl } from '../../../lib/utils/invite-url';
import { handedOutByLabel } from '../../../lib/utils/prefixes';
import type { QrCodeWithGuests } from '../../../lib/supabase/api-types';
import type { QrPlacement } from '../../../lib/hooks/card-art';
import { BusinessCard } from './BusinessCard';
import { QrImage } from './QrImage';

/** The on-screen (and, when there's no card back, print) grid of codes grouped by prefix. */
export function CodeGroups({
  slug,
  groups,
  art,
  ratio,
  placement,
  widthMm,
}: {
  slug: string;
  groups: Array<{ prefix: string; codes: QrCodeWithGuests[] }>;
  art: string | null;
  ratio: number;
  placement: QrPlacement;
  widthMm: number;
}) {
  return (
    <>
      {groups.map(({ prefix, codes }) => (
        <section key={prefix || 'none'} style={{ marginBottom: 'var(--pf-space-6)' }}>
          <Heading level={3} className="pf-no-print">
            {prefix ? handedOutByLabel(prefix) : 'No prefix'} · {codes.length}
          </Heading>
          <div className={art ? 'pf-bcard-grid' : 'pf-code-grid'}>
            {codes.map((code) =>
              art ? (
                <BusinessCard
                  key={code.id}
                  artUrl={art}
                  ratio={ratio}
                  qrValue={inviteUrl(slug, code.token)}
                  placement={placement}
                  widthMm={widthMm}
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
    </>
  );
}
