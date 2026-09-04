import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'RSVP now' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'mobile'] },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Delete guest' } };
export const Small: Story = { args: { size: 'sm' } };
export const FullWidth: Story = { args: { fullWidth: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Mobile: Story = {
  args: { size: 'mobile', children: 'Save my response' },
};
export const GuestMobile: Story = {
  args: { size: 'mobile', children: 'Save my response' },
  decorators: [
    (Story) => (
      <div className="pf-guest" style={{ maxWidth: 340 }}>
        <Story />
      </div>
    ),
  ],
};
export const GuestSecondary: Story = {
  args: { size: 'mobile', variant: 'secondary', children: 'Apple / other (.ics)' },
  decorators: [
    (Story) => (
      <div className="pf-guest" style={{ maxWidth: 340 }}>
        <Story />
      </div>
    ),
  ],
};
