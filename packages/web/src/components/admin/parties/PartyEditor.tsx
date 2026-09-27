import { useEffect, useState } from 'react';
import { Button, Card, Checkbox, Heading, Stack, TextInput } from '@parfett/design-system';
import {
  BLANK_PARTY_FORM,
  clearNewPartyDraft,
  loadNewPartyDraft,
  partyToForm,
  saveNewPartyDraft,
  validatePartyForm,
  type PartyForm,
} from '../../../lib/hooks/parties-admin';
import type { Party, PartyInput } from '../../../lib/supabase/api-types';
import { Field } from './Field';
import { muted, mono, twoCol, spanBoth, savedButtonStyle } from './styles';

// ---------------------------------------------------------------------------
// S2 / S3 — the editor
// ---------------------------------------------------------------------------

export function PartyEditor({
  party,
  onSave,
}: {
  party: Party | null;
  onSave: (values: PartyInput, party: Party | null) => Promise<Party>;
}) {
  const [form, setForm] = useState<PartyForm>(party ? partyToForm(party) : loadNewPartyDraft());
  const [errors, setErrors] = useState<Partial<Record<keyof PartyForm, string>>>({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setForm(party ? partyToForm(party) : loadNewPartyDraft());
    setErrors({});
    setSaveError(null);
  }, [party]);

  useEffect(() => {
    if (!justSaved) {
      return;
    }
    const timer = setTimeout(() => setJustSaved(false), 1800);
    return () => clearTimeout(timer);
  }, [justSaved]);

  useEffect(() => {
    if (!party) {
      saveNewPartyDraft(form);
    }
  }, [party, form]);

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
  let buttonLabel = submitLabel;
  if (busy) {
    buttonLabel = 'Saving…';
  } else if (justSaved) {
    buttonLabel = '✓ Saved';
  }

  const submit = async () => {
    const { errors: formErrors, values } = validatePartyForm(form);
    setErrors(formErrors);
    if (!values || busy) {
      return;
    }
    setBusy(true);
    setSaveError(null);
    setJustSaved(false);
    try {
      await onSave(values, party);
      if (!party) {
        clearNewPartyDraft();
      }
      setJustSaved(true);
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
        <fieldset disabled={busy} style={{ border: 'none', margin: 0, padding: 0 }}>
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
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((f) => {
                      const endTracksStart =
                        !f.eventEndLocal || f.eventEndLocal === f.eventStartLocal;
                      return {
                        ...f,
                        eventStartLocal: value,
                        eventEndLocal:
                          endTracksStart || f.eventEndLocal < value ? value : f.eventEndLocal,
                      };
                    });
                  }}
                />
              </Field>
              <Field label="Ends" error={errors.eventEndLocal}>
                <input
                  type="datetime-local"
                  min={form.eventStartLocal || undefined}
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
                borderTop: '1px solid var(--pf-color-border)',
                paddingTop: 'var(--pf-space-4)',
              }}
            >
              <Stack gap={3}>
                <Heading level={3}>Guest visibility</Heading>
                <p style={{ ...muted, margin: 0, fontSize: 'var(--pf-font-size-sm)' }}>
                  What guests see about the party as a whole, beyond who&apos;s on their own card.
                </p>
                <Checkbox
                  label="Show the full guest list to guests"
                  checked={form.showGuestList}
                  onChange={(e) => set('showGuestList', e.target.checked)}
                />
                <Checkbox
                  label="Show the total number of guests to guests"
                  checked={form.showGuestCount}
                  onChange={(e) => set('showGuestCount', e.target.checked)}
                />
                <Checkbox
                  label="Let hosts change these two settings later"
                  checked={form.hostsCanEditVisibility}
                  onChange={(e) => set('hostsCanEditVisibility', e.target.checked)}
                />
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
                  onClick={() => {
                    if (!party) {
                      clearNewPartyDraft();
                    }
                    setForm(party ? partyToForm(party) : BLANK_PARTY_FORM);
                  }}
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  style={justSaved ? savedButtonStyle : undefined}
                >
                  {buttonLabel}
                </Button>
              </Stack>
            </div>

            {saveError ? (
              <span style={{ color: 'var(--pf-color-danger)' }}>{saveError}</span>
            ) : null}
          </Stack>
        </fieldset>
      </form>
    </Card>
  );
}
