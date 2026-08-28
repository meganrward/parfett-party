import { HashRouter, Route, Routes } from 'react-router-dom';
import { color, space } from '@parfett/design-system';

function Placeholder({ title }: { title: string }) {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: space[5] }}>
      <h1 style={{ color: color.brand }}>{title}</h1>
      <p style={{ color: color.textMuted }}>Coming soon.</p>
    </main>
  );
}

export function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Placeholder title="Parfett Party" />} />
        <Route path="/:slug/c/:token" element={<Placeholder title="Your invite" />} />
        <Route path="/admin/*" element={<Placeholder title="Admin" />} />
        <Route path="*" element={<Placeholder title="Not found" />} />
      </Routes>
    </HashRouter>
  );
}
