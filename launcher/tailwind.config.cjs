/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/**/*.{html,ts,tsx}',
    './src/renderer/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00ffcc',
          magenta: '#ff00ff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
