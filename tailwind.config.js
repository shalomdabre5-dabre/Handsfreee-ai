/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#070b1f', 900: '#0b1230', 800: '#121b45' },
        brand: { purple: '#8b5cf6', cyan: '#22d3ee' },
      },
    },
  },
  plugins: [],
}
