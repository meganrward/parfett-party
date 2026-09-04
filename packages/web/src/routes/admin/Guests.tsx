import { useMemo, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Heading, SegmentedControl, Stack, StatusPill } from '@parfett/design-system';
import {
  EMPTY_FILTERS,
  filterGuestEntries,
  flattenGuestEntries,
  sortedPrefixes,
  summariseCodes,
  useAdminParty,
  type GuestEntry,
  type GuestFilters,
  type StatusFilter,
} from '../../lib/admin-guests';
import { handedOutByLabel } from '../../lib/prefixes';
import { guestDisplayName, rsvpStatusLabel, rsvpStatusTone } from '../../lib/guests';
import type { GuestPatch } from '../../lib/api-types';

const RSVP_OPTIONS = [
  { label: 'Going', value: 'going' },
  { label: 'Not going', value: 'not_going' },
] as const;

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Any response' },
  { value: 'going', label: 'Going' },
  { value: 'not_going', label: 'Not going' },
  { value: 'awaiting', label: 'Awaiting response' },
];

const muted = { color: 'var(--pf-color-text-muted)' } as const;
const fieldLabel: CSSProperties = { fontSize: 13, color: 'var(--pf-color-text-muted)' };
const controlBox: CSSProperties = {
  padding: '13px 14px',
  border: '1px solid var(--pf-color-border)',
  borderRadius: 8,
  background: 'var(--pf-color-surface)',
  fontSize: 15,
  color: 'var(--pf-color-text)',
  width: '100%',
};

const statValue: CSSProperties = {
  fontSize: 24,
  fontWeight: 'var(--pf-font-weight-bold)',
  lineHeight: 1.1,
};

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={statValue}>{value}</span>
      <span style={{ ...muted, fontSize: 13 }}>{label}</span>
    </div>
  );
}

/** H3 hero stat card: the headcount promoted, then a going/not-going/awaiting bar. */
function StatsHero({ codes }: { codes: Parameters<typeof summariseCodes>[0] }) {
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

function GuestRowCard({
  entry,
  sameCardAs,
  onEdit,
  onRemove,
}: {
  entry: GuestEntry;
  sameCardAs: string | null;
  onEdit: (id: string, patch: GuestPatch) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const { guest } = entry;
  const [name, setName] = useState(guest.name ?? '');

  const commitName = () => {
    const next = name.trim() || null;
    if (next !== guest.name) {
      void onEdit(guest.id, { name: next, status: guest.rsvpStatus });
    }
  };

  return (
    <Card role="group" aria-label={guestDisplayName(guest)} padding={4}>
      <Stack gap={3}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            aria-label={`Name for ${guestDisplayName(guest)}`}
            value={name}
            placeholder="No name"
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '11px 12px',
              border: '1px solid var(--pf-color-border)',
              borderRadius: 8,
              background: 'var(--pf-color-surface)',
              color: 'var(--pf-color-text)',
              fontSize: 16,
              fontWeight: 'var(--pf-font-weight-medium)',
            }}
          />
          <StatusPill tone={rsvpStatusTone(guest.rsvpStatus)}>
            {rsvpStatusLabel(guest.rsvpStatus)}
          </StatusPill>
        </div>

        <SegmentedControl
          label={`Response for ${guestDisplayName(guest)}`}
          options={RSVP_OPTIONS}
          value={guest.rsvpStatus}
          onChange={(status) => void onEdit(guest.id, { name: guest.name, status })}
          fullWidth
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            borderTop: '1px solid var(--pf-color-border)',
            paddingTop: 10,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{ fontFamily: 'var(--pf-font-mono)', fontSize: 14, letterSpacing: '0.06em' }}
            >
              {entry.token}
            </span>
            <span style={{ ...muted, fontSize: 12 }}>
              handed out by {handedOutByLabel(entry.prefix)}
              {sameCardAs ? ` · same card as ${sameCardAs}` : ''}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void onRemove(guest.id)}>
            Remove
          </Button>
        </div>
      </Stack>
    </Card>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--pf-space-6) var(--pf-space-5)' }}
    >
      <div style={muted}>{children}</div>
    </main>
  );
}

export function Guests() {
  const slug = useParams().slug ?? '';
  const state = useAdminParty(slug);
  const [filters, setFilters] = useState<GuestFilters>(EMPTY_FILTERS);

  const prefixes = useMemo(() => sortedPrefixes(state.codes), [state.codes]);
  const entries = useMemo(() => flattenGuestEntries(state.codes), [state.codes]);
  const visible = useMemo(() => filterGuestEntries(entries, filters), [entries, filters]);

  const siblingName = useMemo(() => {
    const byCode = new Map<string, string[]>();
    for (const e of entries) {
      const list = byCode.get(e.codeId) ?? [];
      list.push(guestDisplayName(e.guest));
      byCode.set(e.codeId, list);
    }
    return (e: GuestEntry): string | null => {
      const names = (byCode.get(e.codeId) ?? []).filter((n) => n !== guestDisplayName(e.guest));
      return names[0] ?? null;
    };
  }, [entries]);

  if (state.loading) {
    return <Page>Loading guests…</Page>;
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

  const filtersActive =
    filters.prefix !== '' || filters.status !== 'all' || filters.query.trim() !== '';

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--pf-space-5)' }}>
      <Stack gap={5}>
        <Stack direction="row" gap={3} align="center" justify="space-between" wrap>
          <Heading level={1} style={{ fontSize: 24 }}>
            {state.party?.name}
          </Heading>
          <Link
            className="pf-button pf-button--secondary pf-button--sm"
            to={`/admin/${slug}/codes`}
          >
            Code sheet
          </Link>
        </Stack>

        <StatsHero codes={state.codes} />

        <Stack gap={2}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {prefixes.length > 0 ? (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={fieldLabel}>Prefix</span>
                <select
                  style={controlBox}
                  value={filters.prefix}
                  onChange={(e) => setFilters((f) => ({ ...f, prefix: e.target.value }))}
                >
                  <option value="">All</option>
                  {prefixes.map((p) => (
                    <option key={p} value={p}>
                      {handedOutByLabel(p)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span />
            )}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={fieldLabel}>Response</span>
              <select
                style={controlBox}
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value as StatusFilter }))
                }
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={fieldLabel}>Search token</span>
            <input
              style={{ ...controlBox, fontFamily: 'var(--pf-font-mono)' }}
              value={filters.query}
              placeholder="e.g. JX4"
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            />
          </label>
        </Stack>

        <Stack direction="row" gap={2} align="baseline" justify="space-between">
          <span style={{ fontSize: 14, fontWeight: 'var(--pf-font-weight-medium)' }}>Guests</span>
          <span style={{ ...muted, fontSize: 13 }}>
            {visible.length} of {entries.length} shown
          </span>
        </Stack>

        {visible.length === 0 ? (
          <Card
            padding={5}
            style={{ borderStyle: 'dashed', background: 'var(--pf-color-surface-sunken)' }}
          >
            <Stack gap={3}>
              <span style={muted}>
                {entries.length === 0
                  ? 'No guests have responded yet.'
                  : 'No guests match these filters.'}
              </span>
              {filtersActive ? (
                <div>
                  <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                    Clear filters
                  </Button>
                </div>
              ) : null}
            </Stack>
          </Card>
        ) : (
          <Stack gap={3}>
            {visible.map((entry) => (
              <GuestRowCard
                key={entry.guest.id}
                entry={entry}
                sameCardAs={siblingName(entry)}
                onEdit={state.editGuest}
                onRemove={state.removeGuest}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </main>
  );
}
