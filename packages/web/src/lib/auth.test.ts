import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('./supabase', () => ({ supabase: mockSupabase }));

import { signIn, signOut } from './auth';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signIn', () => {
  it('trims the email and passes credentials through', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
    await signIn('  meg@example.com  ', 'hunter2');
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'meg@example.com',
      password: 'hunter2',
    });
  });

  it('throws the Supabase error message', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });
    await expect(signIn('meg@example.com', 'wrong')).rejects.toThrow('Invalid login credentials');
  });
});

describe('signOut', () => {
  it('resolves on success and throws on error', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });
    await expect(signOut()).resolves.toBeUndefined();

    mockSupabase.auth.signOut.mockResolvedValue({ error: { message: 'nope' } });
    await expect(signOut()).rejects.toThrow('nope');
  });
});
