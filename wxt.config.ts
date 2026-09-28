import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'WINDOWLESS / GABOR BREAK',
    description: 'A short visual break with a Gabor challenge.',
    permissions: ['storage'],
    action: {
      default_title: 'Open WINDOWLESS',
    },
    commands: {
      'open-windowless': {
        suggested_key: {
          default: 'Ctrl+Shift+8',
        },
        description: 'Open WINDOWLESS visual break',
        global: true,
      },
    },
  },
});
