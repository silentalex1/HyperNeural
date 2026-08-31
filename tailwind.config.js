/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0B',
        primary: '#00F5D4',
        accent: '#7B61FF',
        paper: '#E8E8E8',
        line: '#1F1F23',
        dark: '#0A0A0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        site: '1200px',
      },
      boxShadow: {
        glow: '0 0 80px rgba(0, 245, 212, 0.12)',
        card: '0 18px 50px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}
