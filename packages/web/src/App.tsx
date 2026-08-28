import { HashRouter, Route, Routes } from 'react-router-dom';
import { Button, Card, Heading, Stack } from '@parfett/design-system';
import { GuestFlow } from './routes/GuestFlow';

function Placeholder({ title }: { title: string }) {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '1.5rem' }}>
      <Card>
        <Stack gap={4}>
          <Heading level={1}>{title}</Heading>
          <p style={{ margin: 0, color: 'var(--pf-color-text-muted)' }}>Coming soon.</p>
          <Button>Placeholder action</Button>
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
        <Route path="/:slug/c/:token/info" element={<Placeholder title="Party details" />} />
        <Route path="/admin/*" element={<Placeholder title="Admin" />} />
        <Route path="*" element={<Placeholder title="Not found" />} />
      </Routes>
    </HashRouter>
  );
}
