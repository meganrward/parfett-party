import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SegmentedControl } from './SegmentedControl';

function RsvpExample() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <SegmentedControl
      label="Are you coming?"
      options={[
        { label: 'Going', value: 'going' },
        { label: 'Not going', value: 'not_going' },
      ]}
      value={value}
      onChange={setValue}
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
