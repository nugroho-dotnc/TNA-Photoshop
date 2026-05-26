/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#0f0f0f',
          1: '#1a1a1a',
          2: '#222222',
          3: '#2a2a2a',
          4: '#333333',
        },
        accent: {
          DEFAULT: '#4f8ef7',
          hover: '#6ba3ff',
          muted: '#1e3a6e',
        },
        text: {
          primary: '#f0f0f0',
          secondary: '#a0a0a0',
          muted: '#606060',
        },
        status: {
          error: '#f87171',
          warn: '#fbbf24',
          success: '#4ade80',
          info: '#60a5fa',
        },
      },
    },
  },
  plugins: [],
}
