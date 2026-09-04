import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SegmentedControl } from './SegmentedControl';

const RSVP_OPTIONS = [
  { label: 'Going', value: 'going' },
  { label: 'Not going', value: 'not_going' },
] as const;

function RsvpExample({ fullWidth = false }: { fullWidth?: boolean }) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <SegmentedControl
      label="Are you coming?"
      options={RSVP_OPTIONS}
      value={value}
      onChange={setValue}
      fullWidth={fullWidth}
    />
  );
}

const meta: Meta<typeof SegmentedControl> = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Rsvp: Story = { render: () => <RsvpExample /> };

export const FullWidth: Story = {
  render: () => (
    <div style={{ maxWidth: 340 }}>
      <RsvpExample fullWidth />
    </div>
  ),
};

export const GuestFullWidth: Story = {
  render: () => (
    <div className="pf-guest" style={{ maxWidth: 340 }}>
      <RsvpExample fullWidth />
    </div>
  ),
};
