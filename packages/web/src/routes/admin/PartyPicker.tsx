import { Link } from 'react-router-dom';
import { Card, Heading, Stack } from '@parfett/design-system';
import { useAdminRole, useMyParties } from '../../lib/roles';

/** /admin index: the parties this admin can open. */
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

        {loading ? <p style={{ color: 'var(--pf-color-text-muted)' }}>Loading…</p> : null}
        {error ? <p style={{ color: 'var(--pf-color-danger)' }}>{error}</p> : null}

        {!loading && !error && parties.length === 0 ? (
          <p style={{ color: 'var(--pf-color-text-muted)' }}>
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
              style={{ textDecoration: 'none' }}
            >
              <Card padding={4}>
                <Heading level={3}>{party.name}</Heading>
                <span
                  style={{
                    color: 'var(--pf-color-text-muted)',
                    fontSize: 'var(--pf-font-size-sm)',
                  }}
                >
                  /{party.slug}
                </span>
              </Card>
            </Link>
          ))}
        </Stack>
      </Stack>
    </main>
  );
}
