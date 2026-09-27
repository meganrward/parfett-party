import { Card, Stack } from '@parfett/design-system';
import { summariseCodes } from '../../../lib/hooks/admin-guests';
import { Stat } from './Stat';
import { muted } from './styles';

/** H3 hero stat card: the headcount promoted, then a going/not-going/awaiting bar. */
export function StatsHero({ codes }: { codes: Parameters<typeof summariseCodes>[0] }) {
  const t = summariseCodes(codes);
  const total = t.going + t.notGoing + t.noResponse || 1;
  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <Card padding={5} elevated>
      <Stack gap={4}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <span
            style={{
              fontSize: 52,
              lineHeight: 1,
              fontWeight: 'var(--pf-font-weight-bold)',
              color: 'var(--pf-color-success)',
            }}
          >
            {t.going}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 5 }}>
            <span style={{ fontSize: 15, fontWeight: 'var(--pf-font-weight-medium)' }}>Going</span>
            <span style={{ ...muted, fontSize: 13 }}>
              of {t.guests} guests on {t.codes} cards
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            height: 10,
            borderRadius: 999,
            overflow: 'hidden',
            background: 'var(--pf-color-surface-sunken)',
          }}
        >
          <div style={{ width: pct(t.going), background: 'var(--pf-color-success)' }} />
          <div style={{ width: pct(t.notGoing), background: '#e4b3b0' }} />
          <div style={{ width: pct(t.noResponse), background: 'var(--pf-color-warning-subtle)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 12px' }}>
          <Stat value={t.notGoing} label="Not going" />
          <Stat value={t.noResponse} label="No response" />
          <Stat value={t.unusedCodes} label="Unused codes" />
          <Stat value={t.codes} label="Codes" />
          <Stat value={t.guests} label="Guests" />
        </div>
      </Stack>
    </Card>
  );
}
