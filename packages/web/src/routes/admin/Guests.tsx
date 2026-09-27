import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Heading, Stack } from '@parfett/design-system';
import {
  EMPTY_FILTERS,
  filterGuestEntries,
  flattenGuestEntries,
  sortedPrefixes,
  useAdminParty,
  type GuestEntry,
  type GuestFilters,
  type StatusFilter,
} from '../../lib/hooks/admin-guests';
import { handedOutByLabel } from '../../lib/utils/prefixes';
import { guestDisplayName } from '../../lib/utils/guests';
import {
  controlBox,
  fieldLabel,
  GuestRowCard,
  GuestVisibilityPanel,
  muted,
  StatsHero,
} from '../../components/admin/guests';
import { Page } from '../../components/admin/shared';

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Any response' },
  { value: 'going', label: 'Going' },
  { value: 'not_going', label: 'Not going' },
  { value: 'awaiting', label: 'Awaiting response' },
];

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

        {state.party ? <GuestVisibilityPanel party={state.party} onSaved={state.reload} /> : null}

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
