import type { Meta, StoryObj } from '@storybook/react';
import { StatusPill } from './StatusPill';

const meta: Meta<typeof StatusPill> = {
  title: 'Components/StatusPill',
  component: StatusPill,
  args: { children: 'Going' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'positive', 'negative', 'warning'] },
  },
};

export default meta;
type Story = StoryObj<typeof StatusPill>;

export const Positive: Story = { args: { tone: 'positive', children: 'Going' } };
export const Negative: Story = { args: { tone: 'negative', children: 'Not going' } };
export const Warning: Story = { args: { tone: 'warning', children: 'Awaiting response' } };
export const Neutral: Story = { args: { tone: 'neutral', children: 'Not registered' } };
