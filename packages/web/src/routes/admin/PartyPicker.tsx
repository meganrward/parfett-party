import { Link } from 'react-router-dom';
import { Card, Heading, Stack } from '@parfett/design-system';
import { useAdminRole, useMyParties } from '../../lib/roles';

const muted = { color: 'var(--pf-color-text-muted)' } as const;

/** H2 — /admin index: the parties this admin can open. Purple (back-office) system. */
export function PartyPicker() {
  const { parties, loading, error } = useMyParties();
  const { isAdmin } = useAdminRole();

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--pf-space-5)' }}>
      <Stack gap={4}>
        <Stack direction="row" gap={3} align="center" justify="space-between">
          <Heading level={1}>Parties</Heading>
          {isAdmin ? (
            <Link className="pf-button pf-button--secondary pf-button--sm" to="/admin/parties">
              Manage parties
            </Link>
          ) : null}
        </Stack>

        {loading ? <p style={muted}>Loading…</p> : null}
        {error ? <p style={{ color: 'var(--pf-color-danger)' }}>{error}</p> : null}

        {!loading && !error && parties.length === 0 ? (
          <p style={muted}>
            {isAdmin
              ? 'No parties yet. Create one from “Manage parties”.'
              : 'You don’t have access to any parties yet.'}
          </p>
        ) : null}

        <Stack gap={2}>
          {parties.map((party) => (
            <Link
              key={party.id}
              to={`/admin/${party.slug}/guests`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Card
                padding={4}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  minHeight: 64,
                }}
              >
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 20, fontWeight: 'var(--pf-font-weight-bold)' }}>
                    {party.name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--pf-font-mono)',
                      fontSize: 13,
                      color: 'var(--pf-color-text-muted)',
                    }}
                  >
                    /{party.slug}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  style={{ fontSize: 20, color: 'var(--pf-color-text-muted)' }}
                >
                  ›
                </span>
              </Card>
            </Link>
          ))}
        </Stack>
      </Stack>
    </main>
  );
}
