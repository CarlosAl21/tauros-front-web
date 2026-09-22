/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        bg: '#131313',
        'bg-elev': '#1c1b1b',
        'bg-elev-2': '#252424',
        text: '#e5e2e1',
        muted: '#b7a8a6',
        accent: '#c00000',
        'accent-soft': '#ffb4a8',
        line: '#4a3131',
        success: '#2a8b4b',
        error: '#a02424',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
