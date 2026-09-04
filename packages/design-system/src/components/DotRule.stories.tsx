import type { Meta, StoryObj } from '@storybook/react';
import { DotRule } from './DotRule';

const meta: Meta<typeof DotRule> = {
  title: 'Guest/DotRule',
  component: DotRule,
  decorators: [
    (Story) => (
      <div className="pf-guest" style={{ maxWidth: 342, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DotRule>;

export const Default: Story = {};
