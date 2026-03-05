import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        city: {
          bg: '#0a0a1a',
          panel: '#12122a',
          border: '#2a2a4a',
          accent: '#4ae08a',
          gold: '#ffd700',
          sky: '#1a1a3e',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
