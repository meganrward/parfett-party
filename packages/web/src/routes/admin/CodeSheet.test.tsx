import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,FAKE') },
}));
vi.mock('../../lib/admin-guests', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAdminParty: vi.fn(),
}));
vi.mock('../../lib/card-art', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  readImageFile: vi.fn(),
}));

import { useAdminParty, type AdminPartyState } from '../../lib/admin-guests';
import { readImageFile } from '../../lib/card-art';
import { CodeSheet } from './CodeSheet';
import type { QrCodeWithGuests } from '../../lib/api-types';

const usedGuest = { id: 'g1', name: 'Ellie', rsvpStatus: 'going' as const, createdAt: 't' };

const codes: QrCodeWithGuests[] = [
  { id: 'c1', token: 'JAAA', prefix: 'J', guests: [usedGuest] },
  { id: 'c2', token: 'JBBB', prefix: 'J', guests: [] },
  { id: 'c3', token: 'KCCC', prefix: 'K', guests: [] },
];

function makeState(over: Partial<AdminPartyState> = {}): AdminPartyState {
  return {
    loading: false,
    notFound: false,
    error: null,
    party: { id: 'p1', slug: 'christmas', name: 'Parfett Christmas' } as never,
    codes,
    reload: vi.fn().mockResolvedValue(undefined),
    editGuest: vi.fn().mockResolvedValue(undefined),
    removeGuest: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

function renderSheet() {
  return render(
    <MemoryRouter
      initialEntries={['/admin/christmas/codes']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/admin/:slug/codes" element={<CodeSheet />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe('CodeSheet — plain grid', () => {
  it('shows loading and not-found states', () => {
    vi.mocked(useAdminParty).mockReturnValue(makeState({ loading: true }));
    const { rerender } = renderSheet();
    expect(screen.getByText(/loading codes/i)).toBeInTheDocument();

    vi.mocked(useAdminParty).mockReturnValue(makeState({ notFound: true }));
    rerender(<div />);
    renderSheet();
    expect(screen.getByText(/doesn't exist/i)).toBeInTheDocument();
  });

  it('renders a QR card per code, grouped by prefix, no housemate label on the card', async () => {
    vi.mocked(useAdminParty).mockReturnValue(makeState());
    renderSheet();

    expect(screen.getByRole('heading', { name: /housemate j · 2/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /housemate k · 1/i })).toBeInTheDocument();

    const imgs = await screen.findAllByRole('img');
    expect(imgs).toHaveLength(3);
    expect(imgs[0]!.getAttribute('alt')).toMatch(/\/#\/christmas\/c\/JAAA$/);
    expect(screen.getByText('JAAA')).toBeInTheDocument();
  });

  it('"Unused codes only" hides codes that already have a guest', async () => {
    vi.mocked(useAdminParty).mockReturnValue(makeState());
    renderSheet();
    await screen.findAllByRole('img');
    await userEvent.click(screen.getByRole('checkbox', { name: /unused codes only/i }));
    expect(screen.queryByText('JAAA')).not.toBeInTheDocument();
    expect(screen.getByText('JBBB')).toBeInTheDocument();
  });

  it('Print triggers window.print', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    vi.mocked(useAdminParty).mockReturnValue(makeState());
    renderSheet();
    await userEvent.click(screen.getByRole('button', { name: /^print$/i }));
    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });
});

describe('CodeSheet — business cards', () => {
  it('uploading art switches to business-card mode and composites the QR', async () => {
    vi.mocked(useAdminParty).mockReturnValue(makeState());
    vi.mocked(readImageFile).mockResolvedValue({
      dataUrl: 'data:image/png;base64,ART',
      ratio: 1.5,
    });
    const { container } = renderSheet();

    const file = new File(['x'], 'card.png', { type: 'image/png' });
    await userEvent.upload(container.querySelector('input[type=file]')!, file);

    // drag-to-place editor + Replace button appear
    expect(await screen.findByRole('heading', { name: /qr position/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /drag to move the qr code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /replace card design/i })).toBeInTheDocument();

    // every card now uses the artwork; QR overlays it
    const art = container.querySelectorAll('img.pf-bcard__art');
    expect(art.length).toBeGreaterThanOrEqual(3);
    expect(art[0]!.getAttribute('src')).toBe('data:image/png;base64,ART');
    expect(container.querySelectorAll('img.pf-bcard__qr').length).toBeGreaterThanOrEqual(3);

    // remove -> back to the plain grid
    await userEvent.click(screen.getByRole('button', { name: /remove card design/i }));
    expect(container.querySelector('img.pf-bcard__art')).toBeNull();
    expect(screen.getByText('JAAA')).toBeInTheDocument();
  });

  it('shows a note when the image is too large to persist', async () => {
    vi.mocked(useAdminParty).mockReturnValue(makeState());
    vi.mocked(readImageFile).mockResolvedValue({
      dataUrl: 'data:image/png;base64,' + 'A'.repeat(4_000_000),
      ratio: 1.5,
    });
    const { container } = renderSheet();
    await userEvent.upload(
      container.querySelector('input[type=file]')!,
      new File(['x'], 'big.png', { type: 'image/png' }),
    );
    expect(await screen.findByText(/session only/i)).toBeInTheDocument();
  });
});
