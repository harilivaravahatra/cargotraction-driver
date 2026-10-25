/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { bassin: '#0e5165', 'bassin-dark': '#093d4c' },
      boxShadow: { card: '0 8px 24px rgba(15, 23, 42, 0.08)' }
    }
  },
  plugins: []
}
