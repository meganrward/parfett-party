import type { Guest, RsvpStatus } from './guests';

/** Party info as returned by the anonymous get_qr RPC. */
export interface QrInfo {
  slug: string;
  partyName: string;
  eventStart: string | null;
  eventEnd: string | null;
  location: string | null;
  description: string | null;
  guestCount: number;
  showGuestList: boolean;
  showGuestCount: boolean;
  /** Party-wide count of guests going; null when showGuestCount is false. */
  partyGuestCount: number | null;
}

export interface Party {
  id: string;
  slug: string;
  name: string;
  eventStart: string | null;
  eventEnd: string | null;
  location: string | null;
  description: string | null;
  qrCount: number;
  prefixes: string[];
  tokenLength: number;
  alphabet: string;
  showGuestList: boolean;
  showGuestCount: boolean;
  hostsCanEditVisibility: boolean;
  createdAt: string;
}

export interface PartyInput {
  slug: string;
  name: string;
  eventStart?: string | null;
  eventEnd?: string | null;
  location?: string | null;
  description?: string | null;
  qrCount?: number;
  prefixes?: string[];
  tokenLength?: number;
  alphabet?: string;
  showGuestList?: boolean;
  showGuestCount?: boolean;
  hostsCanEditVisibility?: boolean;
}

export interface GuestVisibility {
  showGuestList: boolean;
  showGuestCount: boolean;
}

export interface HostRow {
  userId: string;
  name: string;
  isAdmin: boolean;
  /** 'pending' until they follow the invite/recovery email and set a password */
  status: 'pending' | 'active';
}

export interface CreateHostResult {
  host: HostRow;
}

export interface QrCodeWithGuests {
  id: string;
  token: string;
  prefix: string | null;
  guests: Guest[];
}

export interface GuestPatch {
  name: string | null;
  status: RsvpStatus | null;
}

export interface GenerateQrCodesInput {
  partyId: string;
  count?: number;
  prefixes?: string[];
  tokenLength?: number;
  alphabet?: string;
  mode?: 'append' | 'regenerate-unused';
}

export interface GeneratedQrCode {
  id: string;
  token: string;
  prefix: string | null;
}

export interface GenerateQrCodesResult {
  mode: string;
  deleted: number;
  count: number;
  created: GeneratedQrCode[];
}
