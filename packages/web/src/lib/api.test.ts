import { beforeEach, describe, expect, it, vi } from 'vitest';

interface Result {
  data: unknown;
  error: { message: string; context?: { json: () => Promise<unknown> } } | null;
}

const { state, mockSupabase } = vi.hoisted(() => {
  const s = {
    fromResults: [] as Result[],
    rpcResult: { data: null, error: null } as Result,
    invokeResult: { data: null, error: null } as Result,
    calls: [] as unknown[][],
  };

  const makeBuilder = (result: Result) => {
    const settled = Promise.resolve(result);
    const builder: Record<string, unknown> = {};
    const chain =
      (name: string) =>
      (...args: unknown[]) => {
        s.calls.push([name, ...args]);
        return builder;
      };
    for (const m of ['select', 'eq', 'order', 'in', 'update', 'insert', 'delete', 'upsert']) {
      builder[m] = vi.fn(chain(m));
    }
    builder.single = vi.fn(() => settled);
    builder.maybeSingle = vi.fn(() => settled);
    // Make the builder awaitable like a PostgREST query. bind (not a .then call)
    // keeps this clear of the no-.then lint rule.
    builder.then = settled.then.bind(settled);
    return builder;
  };

  const supabase = {
    from: vi.fn((table: string) => {
      s.calls.push(['from', table]);
      return makeBuilder(s.fromResults.length ? s.fromResults.shift()! : { data: [], error: null });
    }),
    rpc: vi.fn((name: string, args: unknown) => {
      s.calls.push(['rpc', name, args]);
      return Promise.resolve(s.rpcResult);
    }),
    functions: {
      invoke: vi.fn((name: string, opts: unknown) => {
        s.calls.push(['invoke', name, opts]);
        return Promise.resolve(s.invokeResult);
      }),
    },
  };

  return { state: s, mockSupabase: supabase };
});

vi.mock('./supabase', () => ({ supabase: mockSupabase }));

import {
  addGuest,
  createParty,
  deleteGuest,
  getHost,
  getPartyBySlug,
  getQr,
  invokeCreateHost,
  invokeGenerateQrCodes,
  listHosts,
  listGuests,
  listMyParties,
  listPartyHosts,
  listQrCodesWithGuests,
  setPartyHosts,
  updateGuest,
  updateGuestAdmin,
  updateParty,
  upsertHost,
} from './api';

const partyRow = {
  id: 'p1',
  slug: 'christmas',
  name: 'Parfett Christmas',
  event_start: null,
  event_end: null,
  location: null,
  description: null,
  qr_count: 75,
  prefixes: ['J'],
  token_length: 10,
  alphabet: 'ABCDEFGHJKLMNPQRTUVWXYZ23456789',
  created_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  state.fromResults = [];
  state.rpcResult = { data: null, error: null };
  state.invokeResult = { data: null, error: null };
  state.calls = [];
  vi.clearAllMocks();
});

describe('getQr', () => {
  it('returns mapped info when the RPC reports found', async () => {
    state.rpcResult = {
      data: [
        {
          found: true,
          slug: 'christmas',
          party_name: 'Parfett Christmas',
          event_start: null,
          event_end: null,
          location: null,
          description: null,
          guest_count: 2,
        },
      ],
      error: null,
    };
    await expect(getQr('  jx4k ')).resolves.toMatchObject({ slug: 'christmas', guestCount: 2 });
    expect(state.calls[0]).toEqual(['rpc', 'get_qr', { p_token: 'JX4K' }]);
  });

  it('returns null for found=false and for an empty result', async () => {
    state.rpcResult = { data: [{ found: false }], error: null };
    await expect(getQr('JX4K')).resolves.toBeNull();
    state.rpcResult = { data: [], error: null };
    await expect(getQr('JX4K')).resolves.toBeNull();
  });

  it('throws the RPC error message', async () => {
    state.rpcResult = { data: null, error: { message: 'boom' } };
    await expect(getQr('JX4K')).rejects.toThrow('boom');
  });
});

describe('listGuests', () => {
  it('maps rows and coerces status', async () => {
    state.rpcResult = {
      data: [
        { id: 'g1', name: 'Dave', rsvp_status: 'going', created_at: 't1' },
        { id: 'g2', name: null, rsvp_status: 'bogus', created_at: 't2' },
      ],
      error: null,
    };
    const guests = await listGuests('jx4k');
    expect(guests).toEqual([
      { id: 'g1', name: 'Dave', rsvpStatus: 'going', createdAt: 't1' },
      { id: 'g2', name: null, rsvpStatus: null, createdAt: 't2' },
    ]);
  });
});

describe('addGuest / updateGuest', () => {
  it('addGuest normalises the token and returns the new id', async () => {
    state.rpcResult = { data: 'new-id', error: null };
    await expect(addGuest({ token: ' w9 tf ', name: ' Sam ', status: 'going' })).resolves.toBe(
      'new-id',
    );
    expect(state.calls[0]).toEqual([
      'rpc',
      'add_guest',
      { p_token: 'W9TF', p_name: ' Sam ', p_status: 'going' },
    ]);
  });

  it('updateGuest forwards all four params', async () => {
    state.rpcResult = { data: null, error: null };
    await updateGuest({ token: 'JX4K', guestId: 'g1', name: null, status: 'not_going' });
    expect(state.calls[0]).toEqual([
      'rpc',
      'update_guest',
      { p_token: 'JX4K', p_guest_id: 'g1', p_name: null, p_status: 'not_going' },
    ]);
  });

  it('propagates an RPC error', async () => {
    state.rpcResult = { data: null, error: { message: 'unknown code' } };
    await expect(addGuest({ token: 'NOPE', name: null, status: null })).rejects.toThrow(
      'unknown code',
    );
  });
});

describe('party reads', () => {
  it('listMyParties maps rows newest-first (as ordered by the query)', async () => {
    state.fromResults = [{ data: [partyRow], error: null }];
    const parties = await listMyParties();
    expect(parties).toHaveLength(1);
    expect(parties[0]).toMatchObject({ id: 'p1', slug: 'christmas', qrCount: 75 });
    expect(state.calls).toContainEqual(['from', 'parties']);
    expect(state.calls).toContainEqual(['order', 'created_at', { ascending: false }]);
  });

  it('getPartyBySlug returns null when nothing matches, mapped party when it does', async () => {
    state.fromResults = [{ data: null, error: null }];
    await expect(getPartyBySlug('missing')).resolves.toBeNull();
    state.fromResults = [{ data: partyRow, error: null }];
    await expect(getPartyBySlug('christmas')).resolves.toMatchObject({ id: 'p1' });
  });

  it('listPartyHosts returns just the user ids', async () => {
    state.fromResults = [{ data: [{ user_id: 'u1' }, { user_id: 'u2' }], error: null }];
    await expect(listPartyHosts('p1')).resolves.toEqual(['u1', 'u2']);
  });

  it('listQrCodesWithGuests maps the embedded guests', async () => {
    state.fromResults = [
      {
        data: [
          {
            id: 'q1',
            token: 'JX4K',
            prefix: 'J',
            guests: [{ id: 'g1', name: 'A', rsvp_status: 'going', created_at: 't' }],
          },
        ],
        error: null,
      },
    ];
    const codes = await listQrCodesWithGuests('p1');
    expect(codes[0]).toEqual({
      id: 'q1',
      token: 'JX4K',
      prefix: 'J',
      guests: [{ id: 'g1', name: 'A', rsvpStatus: 'going', createdAt: 't' }],
    });
  });

  it('listHosts maps rows and throws on error', async () => {
    state.fromResults = [
      {
        data: [{ user_id: 'u1', name: 'Meg', is_admin: true, created_at: 't' }],
        error: null,
      },
    ];
    await expect(listHosts()).resolves.toEqual([{ userId: 'u1', name: 'Meg', isAdmin: true }]);
    state.fromResults = [{ data: null, error: { message: 'denied' } }];
    await expect(listHosts()).rejects.toThrow('denied');
  });

  it('list helpers tolerate a null data payload', async () => {
    state.fromResults = [{ data: null, error: null }];
    await expect(listMyParties()).resolves.toEqual([]);
    state.fromResults = [{ data: null, error: null }];
    await expect(listQrCodesWithGuests('p1')).resolves.toEqual([]);
    state.fromResults = [{ data: null, error: null }];
    await expect(listPartyHosts('p1')).resolves.toEqual([]);
  });
});

describe('party + guest + admin writes', () => {
  it('createParty inserts the snake_cased row and returns the mapped party', async () => {
    state.fromResults = [{ data: partyRow, error: null }];
    const party = await createParty({ slug: 'christmas', name: 'Parfett Christmas' });
    expect(party).toMatchObject({ id: 'p1', slug: 'christmas' });
    expect(state.calls).toContainEqual([
      'insert',
      { slug: 'christmas', name: 'Parfett Christmas' },
    ]);
  });

  it('updateParty patches by id and returns the mapped party', async () => {
    state.fromResults = [{ data: { ...partyRow, name: 'Renamed' }, error: null }];
    const party = await updateParty('p1', { name: 'Renamed' });
    expect(party.name).toBe('Renamed');
    expect(state.calls).toContainEqual(['update', { name: 'Renamed' }]);
    expect(state.calls).toContainEqual(['eq', 'id', 'p1']);
  });

  it('updateGuestAdmin writes name + rsvp_status by id', async () => {
    state.fromResults = [{ data: null, error: null }];
    await updateGuestAdmin('g1', { name: 'Sam', status: 'going' });
    expect(state.calls).toContainEqual(['update', { name: 'Sam', rsvp_status: 'going' }]);
    expect(state.calls).toContainEqual(['eq', 'id', 'g1']);
  });

  it('deleteGuest deletes by id and throws on error', async () => {
    state.fromResults = [{ data: null, error: null }];
    await deleteGuest('g1');
    expect(state.calls).toContainEqual(['delete']);
    state.fromResults = [{ data: null, error: { message: 'nope' } }];
    await expect(deleteGuest('g1')).rejects.toThrow('nope');
  });

  it('upsertHost defaults is_admin to false', async () => {
    state.fromResults = [{ data: null, error: null }];
    await upsertHost({ userId: 'u1', name: 'Meg' });
    expect(state.calls).toContainEqual(['upsert', { user_id: 'u1', name: 'Meg', is_admin: false }]);
  });

  it('getHost returns the mapped row or null', async () => {
    state.fromResults = [
      {
        data: { user_id: 'u1', name: 'Meg', is_admin: true, created_at: 't' },
        error: null,
      },
    ];
    await expect(getHost('u1')).resolves.toEqual({
      userId: 'u1',
      name: 'Meg',
      isAdmin: true,
    });
    state.fromResults = [{ data: null, error: null }];
    await expect(getHost('u2')).resolves.toBeNull();
  });
});

describe('setPartyHosts', () => {
  it('deletes existing grants then inserts the new set', async () => {
    state.fromResults = [
      { data: null, error: null },
      { data: null, error: null },
    ];
    await setPartyHosts('p1', ['u1', 'u2']);
    expect(state.calls).toContainEqual(['delete']);
    expect(state.calls).toContainEqual([
      'insert',
      [
        { party_id: 'p1', user_id: 'u1' },
        { party_id: 'p1', user_id: 'u2' },
      ],
    ]);
  });

  it('only deletes when the new set is empty', async () => {
    state.fromResults = [{ data: null, error: null }];
    await setPartyHosts('p1', []);
    expect(state.calls.filter((c) => c[0] === 'from')).toHaveLength(1);
    expect(state.calls).not.toContainEqual(['insert', expect.anything()]);
  });

  it('stops if the delete fails', async () => {
    state.fromResults = [{ data: null, error: { message: 'cannot delete' } }];
    await expect(setPartyHosts('p1', ['u1'])).rejects.toThrow('cannot delete');
  });
});

describe('invokeGenerateQrCodes', () => {
  it('maps the input to the function body and returns the result', async () => {
    state.invokeResult = {
      data: { mode: 'append', deleted: 0, count: 3, created: [] },
      error: null,
    };
    const res = await invokeGenerateQrCodes({ partyId: 'p1', count: 3, mode: 'append' });
    expect(res).toEqual({ mode: 'append', deleted: 0, count: 3, created: [] });
    expect(state.calls[0]).toEqual([
      'invoke',
      'generate-qr-codes',
      {
        body: {
          party_id: 'p1',
          count: 3,
          prefixes: undefined,
          token_length: undefined,
          alphabet: undefined,
          mode: 'append',
        },
      },
    ]);
  });

  it('throws when the function returns an error', async () => {
    state.invokeResult = { data: null, error: { message: 'forbidden' } };
    await expect(invokeGenerateQrCodes({ partyId: 'p1' })).rejects.toThrow('forbidden');
  });

  it("surfaces the function's own error body when present", async () => {
    state.invokeResult = {
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: { json: async () => ({ error: 'a valid email is required' }) },
      },
    };
    await expect(invokeGenerateQrCodes({ partyId: 'p1' })).rejects.toThrow(
      'a valid email is required',
    );
  });
});

describe('invokeCreateHost', () => {
  it('posts name + email and returns the result', async () => {
    state.invokeResult = {
      data: { host: { userId: 'u9', name: 'Kit', isAdmin: false }, invited: true, setupLink: null },
      error: null,
    };
    const res = await invokeCreateHost({ name: 'Kit', email: 'kit@example.com' });
    expect(res.host).toEqual({ userId: 'u9', name: 'Kit', isAdmin: false });
    expect(res.invited).toBe(true);
    expect(state.calls[0]).toEqual([
      'invoke',
      'create-host',
      { body: { name: 'Kit', email: 'kit@example.com' } },
    ]);
  });
});
