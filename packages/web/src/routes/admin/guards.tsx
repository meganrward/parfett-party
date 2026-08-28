import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAdminRole, useMyParties } from '../../lib/roles';

function Checking() {
  return (
    <main
      style={{ maxWidth: 400, margin: '0 auto', padding: 'var(--pf-space-7) var(--pf-space-5)' }}
    >
      <p style={{ color: 'var(--pf-color-text-muted)' }}>Checking access…</p>
    </main>
  );
}

/** Only super-admins may see the wrapped routes. */
export function RequireSuper() {
  const { role, loading } = useAdminRole();
  if (loading) {
    return <Checking />;
  }
  return role === 'super' ? <Outlet /> : <Navigate to="/admin" replace />;
}

/** Only admins with access to the party in the :slug param may see the wrapped routes. */
export function RequirePartyAccess() {
  const { slug } = useParams();
  const { parties, loading } = useMyParties();
  if (loading) {
    return <Checking />;
  }
  return parties.some((p) => p.slug === slug) ? <Outlet /> : <Navigate to="/admin" replace />;
}
