import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  args: { children: 'A surface for grouped content.' },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {};
export const Elevated: Story = { args: { elevated: true } };
export const TightPadding: Story = { args: { padding: 3 } };
