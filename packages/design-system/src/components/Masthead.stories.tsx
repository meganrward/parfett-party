import type { Meta, StoryObj } from '@storybook/react';
import { Masthead } from './Masthead';

const meta: Meta<typeof Masthead> = {
  title: 'Guest/Masthead',
  component: Masthead,
  args: {
    eyebrow: "You're invited to my birthday dinner!",
    wordmark: '19 Parfett Street',
  },
  decorators: [
    (Story) => (
      <div className="pf-guest" style={{ maxWidth: 342, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Masthead>;

export const Invite: Story = { args: { wordmarkSize: 46 } };
export const GuestList: Story = {
  args: { eyebrow: 'Everyone on this card', wordmarkSize: 38 },
};
export const SignIn: Story = {
  args: { eyebrow: 'Hosts only', wordmarkSize: 40, headingLevel: null },
};
