import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Checkbox, Heading, Stack, TextInput } from '@parfett/design-system';
import {
  BLANK_PARTY_FORM,
  partyToForm,
  useSuperParties,
  validatePartyForm,
  type PartyForm,
} from '../../lib/parties-admin';
import { onlyUnusedCodes } from '../../lib/admin-guests';
import * as api from '../../lib/api';
import type { HostRow, GenerateQrCodesResult, Party, PartyInput } from '../../lib/api-types';

const muted = { color: 'var(--pf-color-text-muted)' } as const;
const mono = { fontFamily: 'var(--pf-font-mono)' } as const;

const twoCol: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 'var(--pf-space-4)',
};

const spanBoth: CSSProperties = { gridColumn: '1 / -1' };

function Field({
  label,
  error,
  span,
  children,
}: {
  label: string;
  error?: string;
  span?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--pf-space-1)',
        ...(span ? spanBoth : null),
      }}
    >
      <span
        style={{ fontSize: 'var(--pf-font-size-sm)', fontWeight: 'var(--pf-font-weight-medium)' }}
      >
        {label}
      </span>
      {children}
      {error ? <span style={{ color: 'var(--pf-color-danger)' }}>{error}</span> : null}
    </label>
  );
}

// ---------------------------------------------------------------------------
// S2 / S3 — the editor
// ---------------------------------------------------------------------------

function PartyEditor({
  party,
  onSave,
}: {
  party: Party | null;
  onSave: (values: PartyInput, party: Party | null) => Promise<Party>;
}) {
  const [form, setForm] = useState<PartyForm>(party ? partyToForm(party) : BLANK_PARTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof PartyForm, string>>>({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setForm(party ? partyToForm(party) : BLANK_PARTY_FORM);
    setErrors({});
    setSaveError(null);
  }, [party]);

  const set = <K extends keyof PartyForm>(key: K, value: PartyForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const errorCount = Object.keys(errors).length;
  const submitLabel = party ? 'Save changes' : 'Create party';
  const verb = party ? 'saved' : 'created';
  const fieldsNeed = errorCount === 1 ? 'field needs' : 'fields need';
  const footerNote =
    errorCount > 0
      ? `${errorCount} ${fieldsNeed} attention before this can be ${verb}.`
      : 'Changing the alphabet or token length only affects codes made from now on.';

  const submit = async () => {
    const { errors: formErrors, values } = validatePartyForm(form);
    setErrors(formErrors);
    if (!values || busy) {
      return;
    }
    setBusy(true);
    setSaveError(null);
    try {
      await onSave(values, party);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save the party');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding={5} style={{ maxWidth: 900 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Stack gap={4}>
          <Heading level={2}>{party ? `Edit ${party.name}` : 'New party'}</Heading>

          <div style={twoCol}>
            <TextInput
              label="Name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              error={errors.name}
            />
            <TextInput
              label="Slug"
              style={mono}
              hint="Appears in every link, e.g. /christmas/c/… — leave blank to derive from the name."
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              error={errors.slug}
            />
            <Field label="Starts">
              <input
                type="datetime-local"
                value={form.eventStartLocal}
                onChange={(e) => set('eventStartLocal', e.target.value)}
              />
            </Field>
            <Field label="Ends" error={errors.eventEndLocal}>
              <input
                type="datetime-local"
                value={form.eventEndLocal}
                onChange={(e) => set('eventEndLocal', e.target.value)}
              />
            </Field>
            <TextInput
              label="Location"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
            <Field label="Description" span>
              <textarea
                rows={3}
                style={{ resize: 'vertical' }}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </Field>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--pf-color-border)',
              paddingTop: 'var(--pf-space-4)',
            }}
          >
            <Stack gap={4}>
              <Heading level={3}>Code generation</Heading>
              <div style={twoCol}>
                <TextInput
                  label="How many"
                  type="number"
                  value={form.qrCount}
                  onChange={(e) => set('qrCount', e.target.value)}
                  error={errors.qrCount}
                />
                <TextInput
                  label="Token length"
                  type="number"
                  value={form.tokenLength}
                  onChange={(e) => set('tokenLength', e.target.value)}
                  error={errors.tokenLength}
                />
                <div style={spanBoth}>
                  <TextInput
                    label="Prefixes"
                    hint="Optional, e.g. J, K, W — the count is split evenly across them."
                    value={form.prefixes}
                    onChange={(e) => set('prefixes', e.target.value)}
                  />
                </div>
                <div style={spanBoth}>
                  <TextInput
                    label="Alphabet"
                    style={mono}
                    hint="Ambiguity-free by default — no 0/O/1/I/5/S."
                    value={form.alphabet}
                    onChange={(e) => set('alphabet', e.target.value)}
                    error={errors.alphabet}
                  />
                </div>
              </div>
            </Stack>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--pf-space-3)',
              borderTop: '1px solid var(--pf-color-border)',
              paddingTop: 'var(--pf-space-4)',
            }}
          >
            <span style={{ ...muted, fontSize: 'var(--pf-font-size-sm)' }}>{footerNote}</span>
            <Stack direction="row" gap={2}>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => setForm(party ? partyToForm(party) : BLANK_PARTY_FORM)}
              >
                Discard
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving…' : submitLabel}
              </Button>
            </Stack>
          </div>

          {saveError ? <span style={{ color: 'var(--pf-color-danger)' }}>{saveError}</span> : null}
        </Stack>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// S2 — hosts panel
// ---------------------------------------------------------------------------

function AssignHosts({ partyId }: { partyId: string }) {
  const [hosts, setHosts] = useState<HostRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [all, current] = await Promise.all([api.listHosts(), api.listPartyHosts(partyId)]);
      if (active) {
        setHosts(all.filter((h) => !h.isAdmin));
        setSelected(new Set(current));
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [partyId]);

  const toggle = (userId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await api.setPartyHosts(partyId, [...selected]);
      setStatus('Saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save access');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding={5}>
      <Stack gap={3}>
        <Heading level={3}>Hosts for this party</Heading>
        <p style={{ ...muted, margin: 0, fontSize: 'var(--pf-font-size-sm)' }}>
          Who can see the guest list and code sheet. The admin account always can.
        </p>
        {hosts.length === 0 ? (
          <p style={muted}>No host accounts yet — add them under Hosts.</p>
        ) : (
          hosts.map((h) => (
            <Checkbox
              key={h.userId}
              label={h.name}
              checked={selected.has(h.userId)}
              onChange={() => toggle(h.userId)}
            />
          ))
        )}
        <Stack direction="row" gap={3} align="center">
          <Button variant="secondary" disabled={busy} onClick={() => void save()}>
            Save access
          </Button>
          {status ? <span style={muted}>{status}</span> : null}
        </Stack>
      </Stack>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// S3b — regenerate dialog + S2 QR panel
// ---------------------------------------------------------------------------

function RegenerateDialog({
  unusedCount,
  batchSize,
  busy,
  onCancel,
  onConfirm,
}: {
  unusedCount: number;
  batchSize: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Regenerate unused codes?"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(29, 27, 24, 0.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--pf-space-4)',
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: 520,
          maxWidth: '100%',
          background: 'var(--pf-color-surface)',
          borderRadius: 'var(--pf-radius-lg)',
          boxShadow: '0 20px 48px rgba(29, 27, 24, 0.28)',
          padding: 'var(--pf-space-5)',
        }}
      >
        <Stack gap={3}>
          <Heading level={2}>Regenerate unused codes?</Heading>
          <p style={{ margin: 0, color: 'var(--pf-color-text)' }}>
            This deletes the <strong>{unusedCount} codes nobody has scanned yet</strong> and makes a
            fresh batch of {batchSize}. Cards already handed out keep working, but any unused cards
            you&apos;ve printed become dead.
          </p>
          <Stack direction="row" gap={2} justify="flex-end">
            <Button variant="secondary" disabled={busy} onClick={onCancel}>
              Keep them
            </Button>
            <Button variant="danger" disabled={busy} onClick={onConfirm}>
              Delete {unusedCount} and regenerate
            </Button>
          </Stack>
        </Stack>
      </div>
    </div>
  );
}

function GeneratePanel({ party }: { party: Party }) {
  const [busy, setBusy] = useState<null | 'append' | 'regenerate-unused'>(null);
  const [result, setResult] = useState<GenerateQrCodesResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [unusedCount, setUnusedCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const codes = await api.listQrCodesWithGuests(party.id);
        if (active) {
          setUnusedCount(onlyUnusedCodes(codes).length);
        }
      } catch {
        // leave the count at 0 — the dialog still works
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [party.id, result]);

  const run = async (mode: 'append' | 'regenerate-unused') => {
    setConfirming(false);
    setBusy(mode);
    setError(null);
    setResult(null);
    try {
      setResult(await api.invokeGenerateQrCodes({ partyId: party.id, mode }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card padding={5}>
      <Stack gap={3}>
        <Heading level={3}>QR codes</Heading>
        <Stack direction="row" gap={4} wrap>
          <span style={mono}>{party.qrCount} target</span>
          <span style={muted}>{unusedCount} unused</span>
          <span style={muted}>{party.prefixes.length || 'no'} prefixes</span>
        </Stack>
        <Stack direction="row" gap={3} wrap>
          <Button disabled={busy !== null} onClick={() => void run('append')}>
            {busy === 'append' ? 'Generating…' : `Generate ${party.qrCount}`}
          </Button>
          <Button variant="secondary" disabled={busy !== null} onClick={() => setConfirming(true)}>
            Regenerate unused
          </Button>
          <Link
            className="pf-button pf-button--ghost pf-button--md"
            to={`/admin/${party.slug}/codes`}
          >
            Open code sheet
          </Link>
        </Stack>
        {error ? <span style={{ color: 'var(--pf-color-danger)' }}>{error}</span> : null}
        {result ? (
          <span style={muted}>
            Made {result.count} code{result.count === 1 ? '' : 's'}
            {result.deleted ? `, removed ${result.deleted} unused` : ''}.
          </span>
        ) : null}
      </Stack>

      {confirming ? (
        <RegenerateDialog
          unusedCount={unusedCount}
          batchSize={party.qrCount}
          busy={busy !== null}
          onCancel={() => setConfirming(false)}
          onConfirm={() => void run('regenerate-unused')}
        />
      ) : null}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// S1 — two-pane shell
// ---------------------------------------------------------------------------

function RailRow({
  party,
  selected,
  onSelect,
}: {
  party: Party;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: 'var(--pf-space-3) var(--pf-space-4)',
        border: 'none',
        borderLeft: `3px solid ${selected ? 'var(--pf-color-brand)' : 'transparent'}`,
        background: selected ? 'var(--pf-color-brand-subtle)' : 'transparent',
        cursor: 'pointer',
        borderRadius: 'var(--pf-radius-sm)',
      }}
    >
      <Heading level={3} style={{ fontSize: 'var(--pf-font-size-md)' }}>
        {party.name}
      </Heading>
      <span style={{ ...muted, ...mono, fontSize: 'var(--pf-font-size-xs)' }}>
        /{party.slug} · {party.qrCount} codes
      </span>
    </button>
  );
}

function DetailEmpty({ onNew }: { onNew: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--pf-space-3)',
        textAlign: 'center',
        padding: 'var(--pf-space-8) var(--pf-space-5)',
        maxWidth: 460,
        margin: '0 auto',
      }}
    >
      <Heading level={2}>Pick a party to manage</Heading>
      <p style={{ ...muted, margin: 0 }}>
        Its details, host access and code generation open here. The slug derives from the name
        unless you set one.
      </p>
      <Button onClick={onNew}>New party</Button>
    </div>
  );
}

export function Parties() {
  const { parties, loading, error, reload, create, update } = useSuperParties();
  const [selection, setSelection] = useState<string | 'new' | null>(null);

  const handleSave = async (values: PartyInput, party: Party | null) => {
    if (party) {
      return update(party.id, values);
    }
    const created = await create(values);
    setSelection(created.id);
    return created;
  };

  const selectedParty = useMemo(
    () =>
      selection && selection !== 'new' ? (parties.find((p) => p.id === selection) ?? null) : null,
    [parties, selection],
  );

  function renderDetail() {
    if (selection === 'new') {
      return <PartyEditor party={null} onSave={handleSave} />;
    }
    if (selectedParty) {
      return (
        <Stack gap={4}>
          <PartyEditor party={selectedParty} onSave={handleSave} />
          <div style={twoCol}>
            <AssignHosts partyId={selectedParty.id} />
            <GeneratePanel party={selectedParty} />
          </div>
        </Stack>
      );
    }
    return <DetailEmpty onNew={() => setSelection('new')} />;
  }

  return (
    <main style={{ display: 'flex', minHeight: 'calc(100vh - 57px)' }}>
      <aside
        style={{
          flex: 'none',
          width: 320,
          borderRight: '1px solid var(--pf-color-border)',
          background: 'var(--pf-color-surface)',
          padding: 'var(--pf-space-4)',
        }}
      >
        <Stack gap={3}>
          <Stack direction="row" gap={3} align="center" justify="space-between">
            <Heading level={1} style={{ fontSize: 'var(--pf-font-size-lg)' }}>
              Parties
            </Heading>
            <Button size="sm" onClick={() => setSelection('new')}>
              New party
            </Button>
          </Stack>

          {loading ? <p style={muted}>Loading…</p> : null}
          {error ? (
            <Stack gap={2}>
              <span style={{ color: 'var(--pf-color-danger)' }}>Failed to load parties</span>
              <Button size="sm" variant="secondary" onClick={() => void reload()}>
                Try again
              </Button>
            </Stack>
          ) : null}

          {!loading && !error && parties.length === 0 ? (
            <p style={muted}>No parties yet — create the first one.</p>
          ) : null}

          <Stack gap={1}>
            {parties.map((p) => (
              <RailRow
                key={p.id}
                party={p}
                selected={selection === p.id}
                onSelect={() => setSelection((s) => (s === p.id ? null : p.id))}
              />
            ))}
          </Stack>
        </Stack>
      </aside>

      <div style={{ flex: 1, minWidth: 0, padding: 'var(--pf-space-5)' }}>{renderDetail()}</div>
    </main>
  );
}
