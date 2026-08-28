import type { Preview } from '@storybook/react';
import '../src/tokens/tokens.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#fdfcfb' },
        { name: 'surface', value: '#ffffff' },
      ],
    },
  },
};

export default preview;
