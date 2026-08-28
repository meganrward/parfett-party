import type { Meta, StoryObj } from '@storybook/react';
import { Table } from './Table';

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
};

export default meta;
type Story = StoryObj<typeof Table>;

export const GuestList: Story = {
  render: () => (
    <Table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Guest</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>J4KQ</td>
          <td>Dancing Dave</td>
          <td>Going</td>
        </tr>
        <tr>
          <td>W9TF</td>
          <td>—</td>
          <td>Awaiting response</td>
        </tr>
      </tbody>
    </Table>
  ),
};
