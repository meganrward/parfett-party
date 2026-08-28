/** Guest-list derivations shared by the guest flow and the admin dashboard. */

export type RsvpStatus = 'going' | 'not_going';

export interface Guest {
  id: string;
  name: string | null;
  rsvpStatus: RsvpStatus | null;
  createdAt: string;
}

export interface GuestSummary {
  going: number;
  notGoing: number;
  noResponse: number;
  total: number;
}

/** What to show when a guest has no nickname. */
export function guestDisplayName(guest: Pick<Guest, 'name'>): string {
  return guest.name?.trim() || 'Guest';
}

/** First visit to a QR code => show the welcome screen rather than the guest list. */
export function isFirstVisit(guests: readonly Guest[]): boolean {
  return guests.length === 0;
}

export function sortGuests(guests: readonly Guest[]): Guest[] {
  return [...guests].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}

export function summariseGuests(guests: readonly Guest[]): GuestSummary {
  const summary: GuestSummary = { going: 0, notGoing: 0, noResponse: 0, total: guests.length };
  for (const g of guests) {
    if (g.rsvpStatus === 'going') {
      summary.going += 1;
    } else if (g.rsvpStatus === 'not_going') {
      summary.notGoing += 1;
    } else {
      summary.noResponse += 1;
    }
  }
  return summary;
}

export type StatusTone = 'positive' | 'negative' | 'warning';

export function rsvpStatusLabel(status: RsvpStatus | null): string {
  if (status === 'going') {
    return 'Going';
  }
  if (status === 'not_going') {
    return 'Not going';
  }
  return 'Awaiting response';
}

export function rsvpStatusTone(status: RsvpStatus | null): StatusTone {
  if (status === 'going') {
    return 'positive';
  }
  if (status === 'not_going') {
    return 'negative';
  }
  return 'warning';
}
