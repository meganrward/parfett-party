const NEW_HOST_DRAFT_KEY = 'pf-admin-new-host-draft';

export interface NewHostDraft {
  name: string;
  email: string;
}

export function readNewHostDraft(): NewHostDraft {
  try {
    const raw = sessionStorage.getItem(NEW_HOST_DRAFT_KEY);
    if (!raw) {
      return { name: '', email: '' };
    }
    const parsed = JSON.parse(raw) as Partial<NewHostDraft>;
    return { name: parsed.name ?? '', email: parsed.email ?? '' };
  } catch {
    return { name: '', email: '' };
  }
}

export function writeNewHostDraft(draft: NewHostDraft) {
  try {
    sessionStorage.setItem(NEW_HOST_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // sessionStorage unavailable (private mode, etc.) — draft just won't persist.
  }
}

export function clearNewHostDraft() {
  try {
    sessionStorage.removeItem(NEW_HOST_DRAFT_KEY);
  } catch {
    // ignore
  }
}
