import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAdminRole, useMyParties } from '../../lib/hooks/roles';
import { Checking } from '../../components/admin/layout';

/** Only super-admins may see the wrapped routes. */
export function RequireAdmin() {
  const { role, loading } = useAdminRole();
  if (loading) {
    return <Checking />;
  }
  return role === 'admin' ? <Outlet /> : <Navigate to="/admin" replace />;
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
