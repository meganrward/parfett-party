import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Checkbox, Heading, Stack, TextInput } from '@parfett/design-system';
import {
  BLANK_PARTY_FORM,
  partyToForm,
  useSuperParties,
  validatePartyForm,
  type PartyForm,
} from '../../lib/parties-admin';
import * as api from '../../lib/api';
import type { AdminRow, GenerateQrCodesResult, Party, PartyInput } from '../../lib/api-types';

const muted = { color: 'var(--pf-color-text-muted)' } as const;

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pf-space-1)' }}>
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

  const submitLabel = party ? 'Save changes' : 'Create party';

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
    <Card padding={5}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Stack gap={4}>
          <Heading level={2}>{party ? `Edit ${party.name}` : 'New party'}</Heading>

          <TextInput
            label="Name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
          />
          <TextInput
            label="Slug"
            hint="Appears in every link, e.g. /christmas/c/… — leave blank to derive from the name."
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            error={errors.slug}
          />

          <Stack direction="row" gap={4} wrap>
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
          </Stack>

          <TextInput
            label="Location"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
          />
          <Field label="Description">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>

          <Heading level={3}>Code generation</Heading>
          <Stack direction="row" gap={4} wrap>
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
          </Stack>
          <TextInput
            label="Housemate prefixes"
            hint="Optional, e.g. J, K, W — the count is split evenly across them."
            value={form.prefixes}
            onChange={(e) => set('prefixes', e.target.value)}
          />
          <TextInput
            label="Alphabet"
            value={form.alphabet}
            onChange={(e) => set('alphabet', e.target.value)}
            error={errors.alphabet}
          />

          {saveError ? <span style={{ color: 'var(--pf-color-danger)' }}>{saveError}</span> : null}
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : submitLabel}
          </Button>
        </Stack>
      </form>
    </Card>
  );
}

function AssignHousemates({ partyId }: { partyId: string }) {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [all, current] = await Promise.all([api.listAdmins(), api.listPartyAdmins(partyId)]);
      if (active) {
        setAdmins(all.filter((a) => !a.isSuper));
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
      await api.setPartyAdmins(partyId, [...selected]);
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
        <Heading level={3}>Who can manage this party</Heading>
        {admins.length === 0 ? (
          <p style={muted}>No housemate accounts yet — add them under Admins.</p>
        ) : (
          admins.map((a) => (
            <Checkbox
              key={a.userId}
              label={a.displayName}
              checked={selected.has(a.userId)}
              onChange={() => toggle(a.userId)}
            />
          ))
        )}
        {status ? <span style={muted}>{status}</span> : null}
        <Button variant="secondary" disabled={busy} onClick={() => void save()}>
          Save access
        </Button>
      </Stack>
    </Card>
  );
}

function GeneratePanel({ party }: { party: Party }) {
  const [busy, setBusy] = useState<null | 'append' | 'regenerate-unused'>(null);
  const [result, setResult] = useState<GenerateQrCodesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (mode: 'append' | 'regenerate-unused') => {
    if (
      mode === 'regenerate-unused' &&
      !window.confirm('Delete all unused codes and make a fresh batch?')
    ) {
      return;
    }
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
        <Stack direction="row" gap={3} wrap>
          <Button disabled={busy !== null} onClick={() => void run('append')}>
            {busy === 'append' ? 'Generating…' : `Generate ${party.qrCount}`}
          </Button>
          <Button
            variant="secondary"
            disabled={busy !== null}
            onClick={() => void run('regenerate-unused')}
          >
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
    </Card>
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

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--pf-space-5)' }}>
      <Stack gap={5}>
        <Stack direction="row" gap={3} align="center" justify="space-between" wrap>
          <Heading level={1}>Parties</Heading>
          <Button size="sm" onClick={() => setSelection('new')}>
            New party
          </Button>
        </Stack>

        {loading ? <p style={muted}>Loading…</p> : null}
        {error ? (
          <Stack gap={2}>
            <span style={{ color: 'var(--pf-color-danger)' }}>{error}</span>
            <Button variant="secondary" onClick={() => void reload()}>
              Try again
            </Button>
          </Stack>
        ) : null}

        <Stack gap={2}>
          {parties.map((p) => (
            <Card key={p.id} padding={4}>
              <Stack direction="row" gap={3} align="center" justify="space-between" wrap>
                <div>
                  <Heading level={3}>{p.name}</Heading>
                  <span style={{ ...muted, fontSize: 'var(--pf-font-size-sm)' }}>/{p.slug}</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelection((s) => (s === p.id ? null : p.id))}
                >
                  {selection === p.id ? 'Close' : 'Manage'}
                </Button>
              </Stack>
            </Card>
          ))}
        </Stack>

        {selection === 'new' ? <PartyEditor party={null} onSave={handleSave} /> : null}

        {selectedParty ? (
          <Stack gap={4}>
            <PartyEditor party={selectedParty} onSave={handleSave} />
            <AssignHousemates partyId={selectedParty.id} />
            <GeneratePanel party={selectedParty} />
          </Stack>
        ) : null}
      </Stack>
    </main>
  );
}
