/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: {
            primary: '#030303',
            secondary: '#070709',
            tertiary: '#0b0b0f',
          },
          border: 'rgba(255, 255, 255, 0.06)',
          text: {
            primary: '#e3e8ef',
            secondary: '#8b949e',
          },
          accent: {
            primary: '#58a6ff',
            secondary: '#79c0ff',
            tertiary: '#22d3ee',
          },
          success: '#3fb950',
          warning: '#d29922',
          error: '#f85149',
        },
      },
      fontFamily: {
        mono: ['"Fira Code"', '"Cascadia Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
