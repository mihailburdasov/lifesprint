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
        'primary-light': '#E0E7FF',
        'primary-dark': '#4338CA',
        'primary-lighter': '#EEF2FF',
        'primary-darker': '#3730A3',
        secondary: '#10B981',
        'secondary-light': '#D1FAE5',
        'secondary-dark': '#059669',
        'secondary-lighter': '#ECFDF5',
        'secondary-darker': '#047857',
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
        'text-light': {
          light: '#6B7280',
          dark: '#9CA3AF'
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
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
    },
  },
  plugins: [],
}
