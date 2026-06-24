/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0a0b10', // Sleek deep space dark background
        card: '#121420',       // Dark card background
        primary: {
          light: '#8b5cf6',   // Neon violet
          DEFAULT: '#6d28d9', // Deep purple
          dark: '#4c1d95',
        },
        secondary: {
          light: '#2dd4bf',   // Neon teal
          DEFAULT: '#0f766e', // Deep teal
          dark: '#115e59',
        },
        accent: {
          light: '#10b981',   // Emerald green
          DEFAULT: '#047857',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon': '0 0 15px rgba(109, 40, 217, 0.4)',
        'neon-teal': '0 0 15px rgba(45, 212, 191, 0.4)',
      },
      backdropBlur: {
        'glass': '12px',
      }
    },
  },
  plugins: [],
}
