/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Source Sans 3"', 'sans-serif'],
      },
      colors: {
        sage: {
          50: '#f4f7f5',
          100: '#e4ede8',
          200: '#c8dbd2',
          300: '#a0c1b0',
          400: '#74a38e',
          500: '#52876e',
          600: '#3e6b57',
          700: '#335646',
          800: '#2a4438',
          900: '#22382e',
        },
        slate: {
          50: '#f7f8fa',
          100: '#eef0f5',
          200: '#d8dde8',
          300: '#b8c2d4',
          400: '#8fa0ba',
          500: '#6b82a0',
          600: '#546786',
          700: '#44536e',
          800: '#3a475c',
          900: '#333d4d',
        },
      },
    },
  },
  plugins: [],
}
