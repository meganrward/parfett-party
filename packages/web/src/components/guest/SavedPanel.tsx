import { guestDisplayName, rsvpStatusLabel, type Guest } from '../../lib/utils/guests';

/** The "you're on the list" acknowledgement at the top of the guest list. */
export function SavedPanel({ guest }: { guest: Guest }) {
  return (
    <div
      style={{
        background: 'var(--pf-guest-blue-tint)',
        border: '1px solid var(--pf-guest-blue-border)',
        borderRadius: 'var(--pf-radius-lg)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--pf-guest-font-display)',
          fontWeight: 500,
          fontSize: 13,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: 'var(--pf-guest-action)',
        }}
      >
        Thank you — you&rsquo;re on the list
      </span>
      <p style={{ margin: 0, fontSize: 16, color: 'var(--pf-guest-muted)' }}>
        {guestDisplayName(guest)} · {rsvpStatusLabel(guest.rsvpStatus)}. Tap any name to change a
        response.
      </p>
    </div>
  );
}
