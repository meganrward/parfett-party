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
}

export interface HostRow {
  userId: string;
  name: string;
  isAdmin: boolean;
}

export interface CreateHostResult {
  host: HostRow;
  /** true if Supabase sent an invite email */
  invited: boolean;
  /** password-set link the admin can forward if the email doesn't arrive */
  setupLink: string | null;
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
