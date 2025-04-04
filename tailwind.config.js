/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#10B981',
        background: {
          light: '#F9FAFB',
          dark: '#111827'
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1F2937'
        },
        text: {
          light: '#1F2937',
          dark: '#F9FAFB'
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      transitionProperty: {
        'width': 'width',
      },
    },
  },
  plugins: [],
}
