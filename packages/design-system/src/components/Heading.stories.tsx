import type { Meta, StoryObj } from '@storybook/react';
import { Heading } from './Heading';

const meta: Meta<typeof Heading> = {
  title: 'Components/Heading',
  component: Heading,
  args: { children: 'Parfett Christmas Party' },
  argTypes: { level: { control: 'inline-radio', options: [1, 2, 3] } },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Level1: Story = { args: { level: 1 } };
export const Level2: Story = { args: { level: 2 } };
export const Level3: Story = { args: { level: 3 } };
