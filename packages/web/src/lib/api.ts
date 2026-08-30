import { supabase } from './supabase';
import type { Database } from './database.types';
import { normaliseToken } from './token';
import type { Guest, RsvpStatus } from './guests';
import {
  mapHost,
  mapGuest,
  mapParty,
  mapQrCodeWithGuests,
  mapQrInfo,
  partyInputToRow,
  type QrCodeRowish,
} from './api-mappers';
import type {
  HostRow,
  GenerateQrCodesInput,
  GenerateQrCodesResult,
  GuestPatch,
  Party,
  PartyInput,
  QrCodeWithGuests,
  QrInfo,
} from './api-types';

type Fn = keyof Database['public']['Functions'];

function fail(message: string): never {
  throw new Error(message);
}

/** Call an RPC and surface errors. Args are cast: several are nullable in SQL but not in the generated types. */
async function rpc<K extends Fn>(
  name: K,
  args: Record<string, unknown>,
): Promise<Database['public']['Functions'][K]['Returns']> {
  const { data, error } = await supabase.rpc(name, args as never);
  if (error) {
    fail(error.message);
  }
  return data as Database['public']['Functions'][K]['Returns'];
}

// ---------------------------------------------------------------------------
// Anonymous — the guest flow. All keyed by a QR token.
// ---------------------------------------------------------------------------

export async function getQr(token: string): Promise<QrInfo | null> {
  const rows = await rpc('get_qr', { p_token: normaliseToken(token) });
  const row = rows[0];
  return row && row.found ? mapQrInfo(row) : null;
}

export async function listGuests(token: string): Promise<Guest[]> {
  const rows = await rpc('list_guests', { p_token: normaliseToken(token) });
  return rows.map(mapGuest);
}

export async function addGuest(args: {
  token: string;
  name: string | null;
  status: RsvpStatus | null;
}): Promise<string> {
  return rpc('add_guest', {
    p_token: normaliseToken(args.token),
    p_name: args.name,
    p_status: args.status,
  });
}

export async function updateGuest(args: {
  token: string;
  guestId: string;
  name: string | null;
  status: RsvpStatus | null;
}): Promise<void> {
  await rpc('update_guest', {
    p_token: normaliseToken(args.token),
    p_guest_id: args.guestId,
    p_name: args.name,
    p_status: args.status,
  });
}

// ---------------------------------------------------------------------------
// Authenticated — admin views. RLS scopes everything per party.
// ---------------------------------------------------------------------------

export async function listMyParties(): Promise<Party[]> {
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    fail(error.message);
  }
  return (data ?? []).map(mapParty);
}

export async function getPartyBySlug(slug: string): Promise<Party | null> {
  const { data, error } = await supabase.from('parties').select('*').eq('slug', slug).maybeSingle();
  if (error) {
    fail(error.message);
  }
  return data ? mapParty(data) : null;
}

export async function listQrCodesWithGuests(partyId: string): Promise<QrCodeWithGuests[]> {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('id, token, prefix, guests(id, name, rsvp_status, created_at)')
    .eq('party_id', partyId)
    .order('created_at', { ascending: true });
  if (error) {
    fail(error.message);
  }
  return ((data ?? []) as unknown as QrCodeRowish[]).map(mapQrCodeWithGuests);
}

export async function updateGuestAdmin(id: string, patch: GuestPatch): Promise<void> {
  const { error } = await supabase
    .from('guests')
    .update({ name: patch.name, rsvp_status: patch.status })
    .eq('id', id);
  if (error) {
    fail(error.message);
  }
}

export async function deleteGuest(id: string): Promise<void> {
  const { error } = await supabase.from('guests').delete().eq('id', id);
  if (error) {
    fail(error.message);
  }
}

export async function createParty(input: PartyInput): Promise<Party> {
  const { data, error } = await supabase
    .from('parties')
    .insert(partyInputToRow(input))
    .select('*')
    .single();
  if (error) {
    fail(error.message);
  }
  return mapParty(data);
}

export async function updateParty(id: string, patch: Partial<PartyInput>): Promise<Party> {
  const { data, error } = await supabase
    .from('parties')
    .update(partyInputToRow(patch))
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    fail(error.message);
  }
  return mapParty(data);
}

export async function listHosts(): Promise<HostRow[]> {
  const { data, error } = await supabase.from('hosts').select('*').order('name');
  if (error) {
    fail(error.message);
  }
  return (data ?? []).map(mapHost);
}

/** The signed-in user's hosts row, or null if they aren't a host/admin. */
export async function getHost(userId: string): Promise<HostRow | null> {
  const { data, error } = await supabase
    .from('hosts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    fail(error.message);
  }
  return data ? mapHost(data) : null;
}

export async function upsertHost(input: {
  userId: string;
  name: string;
  isAdmin?: boolean;
}): Promise<void> {
  const { error } = await supabase.from('hosts').upsert({
    user_id: input.userId,
    name: input.name,
    is_admin: input.isAdmin ?? false,
  });
  if (error) {
    fail(error.message);
  }
}

export async function listPartyHosts(partyId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('party_hosts')
    .select('user_id')
    .eq('party_id', partyId);
  if (error) {
    fail(error.message);
  }
  return (data ?? []).map((r) => r.user_id);
}

/** Replace the party's admin grants with exactly `userIds`. */
export async function setPartyHosts(partyId: string, userIds: string[]): Promise<void> {
  const { error: delErr } = await supabase.from('party_hosts').delete().eq('party_id', partyId);
  if (delErr) {
    fail(delErr.message);
  }
  if (userIds.length === 0) {
    return;
  }
  const { error: insErr } = await supabase
    .from('party_hosts')
    .insert(userIds.map((user_id) => ({ party_id: partyId, user_id })));
  if (insErr) {
    fail(insErr.message);
  }
}

export async function invokeGenerateQrCodes(
  input: GenerateQrCodesInput,
): Promise<GenerateQrCodesResult> {
  const { data, error } = await supabase.functions.invoke('generate-qr-codes', {
    body: {
      party_id: input.partyId,
      count: input.count,
      prefixes: input.prefixes,
      token_length: input.tokenLength,
      alphabet: input.alphabet,
      mode: input.mode,
    },
  });
  if (error) {
    fail(error.message);
  }
  return data as GenerateQrCodesResult;
}
