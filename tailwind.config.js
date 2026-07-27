/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: '#E26A1F',
          dark: '#B84F12',
          light: '#FFE9D6',
        },
        ink: {
          DEFAULT: '#0F0E0C',
          2: '#3A342B',
          3: '#6B6256',
          4: '#A39A8A',
        },
        warm: {
          bg: '#FAF6EC',
          bgDeep: '#F2EBD8',
          surface: '#FFFFFF',
          surfaceAlt: '#FFFBF1',
          line: 'rgba(15,14,12,0.08)',
        },
      },
      fontFamily: {
        ui: ['var(--font-ui)', 'Poppins', '-apple-system', 'sans-serif'],
        display: ['var(--font-display)', 'Space Grotesk', 'Poppins', 'sans-serif'],
        deva: ['var(--font-deva)', 'Tiro Devanagari Marathi', 'serif'],
      },
    },
  },
  plugins: [],
}
