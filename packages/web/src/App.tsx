import { HashRouter, Route, Routes } from 'react-router-dom';
import { Card, Heading, Stack } from '@parfett/design-system';
import { GuestFlow } from './routes/GuestFlow';
import { PartyInfo } from './routes/PartyInfo';
import { AdminLayout } from './routes/admin/AdminLayout';
import { PartyPicker } from './routes/admin/PartyPicker';
import { Guests } from './routes/admin/Guests';
import { CodeSheet } from './routes/admin/CodeSheet';
import { Parties } from './routes/admin/Parties';
import { Admins } from './routes/admin/Admins';
import { RequirePartyAccess, RequireSuper } from './routes/admin/guards';

function Placeholder({ title }: { title: string }) {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '1.5rem' }}>
      <Card>
        <Stack gap={4}>
          <Heading level={1}>{title}</Heading>
          <p style={{ margin: 0, color: 'var(--pf-color-text-muted)' }}>Coming soon.</p>
        </Stack>
      </Card>
    </main>
  );
}

export function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Placeholder title="Parfett Party" />} />
        <Route path="/:slug/c/:token" element={<GuestFlow />} />
        <Route path="/:slug/c/:token/info" element={<PartyInfo />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<PartyPicker />} />
          <Route element={<RequirePartyAccess />}>
            <Route path=":slug/guests" element={<Guests />} />
            <Route path=":slug/codes" element={<CodeSheet />} />
          </Route>
          <Route element={<RequireSuper />}>
            <Route path="parties" element={<Parties />} />
            <Route path="admins" element={<Admins />} />
          </Route>
        </Route>

        <Route path="*" element={<Placeholder title="Not found" />} />
      </Routes>
    </HashRouter>
  );
}
