/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#f9f7f2',
          100: '#efe8d9',
          200: '#dfd1b5',
          300: '#cbb389',
          400: '#b39b72', // Main Brand Color
          500: '#9d845e',
          600: '#866d4f',
          700: '#705a42',
          800: '#5c4937',
          900: '#4b3c2f',
          950: '#281f19',
        },
        navy: {
          50: '#e8eaf6',
          100: '#c5cae9',
          200: '#9fa8da',
          300: '#7986cb',
          400: '#5c6bc0',
          500: '#3f51b5',
          600: '#3949ab',
          700: '#303f9f',
          800: '#283593',
          900: '#1a237e', // Secondary Brand Color
          950: '#121858',
        },
      },
    },
  },
  plugins: [],
}
