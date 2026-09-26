import { supabase } from './supabase';

/**
 * `signInWithPassword` normally resolves with `{ error }` even on a network
 * failure, but a DNS failure, an aborted request, or Supabase being
 * unreachable can also throw before that — wrap both so callers always get
 * a message that says *why*, not just "Failed to fetch".
 */
function messageOf(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

function describeAuthFailure(err: unknown): string {
  const message = messageOf(err);
  if (message !== 'Failed to fetch') {
    return message;
  }
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return `Could not reach Supabase at ${url ?? '(no VITE_SUPABASE_URL configured)'}. Is the local stack running (npm run db:start) or is the network down?`;
}

export async function signIn(email: string, password: string): Promise<void> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      throw new Error(describeAuthFailure(error));
    }
  } catch (err) {
    throw new Error(describeAuthFailure(err));
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(describeAuthFailure(error));
  }
}
