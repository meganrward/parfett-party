import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Heading,
  SegmentedControl,
  Stack,
  Table,
  TextInput,
} from '@parfett/design-system';
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
import { guestDisplayName } from '../../lib/guests';
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

function Summary({ codes }: { codes: Parameters<typeof summariseCodes>[0] }) {
  const t = summariseCodes(codes);
  const items = [
    ['Codes', t.codes],
    ['Guests', t.guests],
    ['Going', t.going],
    ['Not going', t.notGoing],
    ['No response', t.noResponse],
    ['Unused codes', t.unusedCodes],
  ] as const;
  return (
    <Stack direction="row" gap={5} wrap>
      {items.map(([label, value]) => (
        <div key={label}>
          <div
            style={{ fontSize: 'var(--pf-font-size-xl)', fontWeight: 'var(--pf-font-weight-bold)' }}
          >
            {value}
          </div>
          <div style={{ ...muted, fontSize: 'var(--pf-font-size-sm)' }}>{label}</div>
        </div>
      ))}
    </Stack>
  );
}

function GuestEntryRow({
  entry,
  onEdit,
  onRemove,
}: {
  entry: GuestEntry;
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
    <tr>
      <td>
        <TextInput
          label={`Name for ${guestDisplayName(guest)}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          placeholder="No name"
        />
      </td>
      <td>
        <SegmentedControl
          label={`Response for ${guestDisplayName(guest)}`}
          options={RSVP_OPTIONS}
          value={guest.rsvpStatus}
          onChange={(status) => void onEdit(guest.id, { name: guest.name, status })}
        />
      </td>
      <td>
        <code>{entry.token}</code>
        <div style={{ ...muted, fontSize: 'var(--pf-font-size-sm)' }}>
          {handedOutByLabel(entry.prefix)}
        </div>
      </td>
      <td>
        <Button variant="ghost" size="sm" onClick={() => void onRemove(guest.id)}>
          Remove
        </Button>
      </td>
    </tr>
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

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--pf-space-5)' }}>
      <Stack gap={5}>
        <Stack direction="row" gap={3} align="center" justify="space-between" wrap>
          <Heading level={1}>{state.party?.name}</Heading>
          <Link
            className="pf-button pf-button--secondary pf-button--sm"
            to={`/admin/${slug}/codes`}
          >
            Code sheet
          </Link>
        </Stack>

        <Card padding={5}>
          <Summary codes={state.codes} />
        </Card>

        <Stack direction="row" gap={3} wrap align="end">
          {prefixes.length > 0 ? (
            <label>
              <div style={{ ...muted, fontSize: 'var(--pf-font-size-sm)' }}>Prefix</div>
              <select
                value={filters.prefix}
                onChange={(e) => setFilters((f) => ({ ...f, prefix: e.target.value }))}
              >
                <option value="">All</option>
                {prefixes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            <div style={{ ...muted, fontSize: 'var(--pf-font-size-sm)' }}>Response</div>
            <select
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
          <TextInput
            label="Search token"
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            placeholder="e.g. JX4"
          />
        </Stack>

        <Table>
          <thead>
            <tr>
              <th>Guest</th>
              <th>Response</th>
              <th>Code</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={4} style={muted}>
                  {entries.length === 0
                    ? 'No guests have responded yet.'
                    : 'No guests match these filters.'}
                </td>
              </tr>
            ) : (
              visible.map((entry) => (
                <GuestEntryRow
                  key={entry.guest.id}
                  entry={entry}
                  onEdit={state.editGuest}
                  onRemove={state.removeGuest}
                />
              ))
            )}
          </tbody>
        </Table>
      </Stack>
    </main>
  );
}
