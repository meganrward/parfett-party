import type { Preview, Decorator } from '@storybook/react';
import '../src/tokens/tokens.css';

/**
 * Palette toolbar — flip any story between the shipped host (purple) system and
 * the guest invite-card palette. "guest" wraps the story in `.pf-guest`, which
 * remaps the semantic tokens the components read, and paints the paper ground.
 */
export const globalTypes = {
  palette: {
    description: 'Token palette',
    defaultValue: 'host',
    toolbar: {
      title: 'Palette',
      icon: 'paintbrush',
      items: [
        { value: 'host', title: 'Host — purple system' },
        { value: 'guest', title: 'Guest — invite card' },
      ],
      dynamicTitle: true,
    },
  },
};

const withPalette: Decorator = (Story, context) => {
  if (context.globals.palette !== 'guest') {
    return <Story />;
  }
  return (
    <div
      className="pf-guest"
      style={{
        background: 'var(--pf-guest-paper)',
        color: 'var(--pf-color-text)',
        padding: '1.5rem',
        minHeight: '100vh',
      }}
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withPalette],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#fdfcfb' },
        { name: 'surface', value: '#ffffff' },
        { name: 'guest paper', value: '#fbfaf7' },
        { name: 'guest blue', value: '#e7f0f4' },
      ],
    },
  },
};

export default preview;
