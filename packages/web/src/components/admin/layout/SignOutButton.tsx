import { useState } from 'react';
import { Button } from '@parfett/design-system';
import { signOut } from '../../../lib/supabase/auth';

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void signOut();
      }}
    >
      Sign out
    </Button>
  );
}
