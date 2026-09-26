import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  FirstResponse,
  GuestErrorState,
  GuestList,
  GuestLoadingState,
  GuestUnknownCodeState,
} from '../components/guest';
import { useGuestFlow } from '../lib/hooks/guest-flow';

export function GuestFlow() {
  const params = useParams();
  const slug = params.slug ?? '';
  const token = params.token ?? '';
  const navigate = useNavigate();
  const flow = useGuestFlow(slug, token);

  if (flow.redirectTo) {
    return <Navigate to={flow.redirectTo} replace />;
  }
  if (flow.loading) {
    return <GuestLoadingState message="Loading your invite…" />;
  }
  if (flow.notFound) {
    return <GuestUnknownCodeState />;
  }
  if (flow.error) {
    return <GuestErrorState message={flow.error} onRetry={() => void flow.actions.reload()} />;
  }

  const partyName = flow.info?.partyName ?? 'the party';
  const infoPath = `/${slug}/c/${token}/info`;

  if (flow.guests.length === 0) {
    return (
      <FirstResponse
        partyName={partyName}
        onSubmit={async (draft) => {
          await flow.actions.addGuest(draft);
          navigate(infoPath);
        }}
      />
    );
  }

  return (
    <GuestList
      partyName={partyName}
      guests={flow.guests}
      onEdit={(id, draft) => flow.actions.editGuest(id, draft)}
      onAdd={(draft) => flow.actions.addGuest(draft)}
      onContinue={() => navigate(infoPath)}
    />
  );
}
