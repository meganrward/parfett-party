import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from './Stack';
import { Button } from './Button';

const meta: Meta<typeof Stack> = {
  title: 'Components/Stack',
  component: Stack,
};

export default meta;
type Story = StoryObj<typeof Stack>;

export const Column: Story = {
  args: {
    gap: 3,
    children: [<Button key="a">One</Button>, <Button key="b">Two</Button>],
  },
};

export const Row: Story = {
  args: {
    direction: 'row',
    gap: 2,
    children: [<Button key="a">One</Button>, <Button key="b">Two</Button>],
  },
};
