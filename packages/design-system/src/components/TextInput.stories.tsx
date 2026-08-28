import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from './TextInput';

const meta: Meta<typeof TextInput> = {
  title: 'Components/TextInput',
  component: TextInput,
  args: { label: 'Your nickname', placeholder: 'e.g. Dancing Dave' },
};

export default meta;
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: 'Shown to other guests on this card.' } };
export const WithError: Story = {
  args: { defaultValue: 'ZZZZ', error: "We don't recognise that code." },
};
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Locked' } };
