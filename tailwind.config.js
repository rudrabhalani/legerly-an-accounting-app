/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Royal Indigo
          light: '#EEF2FF',   // Soft Indigo
          hover: '#4338CA',
          dark: '#3730A3',
        },
        moneyIn: {
          DEFAULT: '#16A34A', // Emerald Green
          tint: '#DCFCE7',    // Emerald Green Tint
          hover: '#15803D',
          dark: '#14532D',
        },
        moneyOut: {
          DEFAULT: '#DC2626', // Coral Red
          tint: '#FEE2E2',    // Coral Red Tint
          hover: '#B91C1C',
          dark: '#7F1D1D',
        },
        warning: {
          DEFAULT: '#F59E0B', // Amber
          tint: '#FEF3C7',    // Amber Tint
          hover: '#D97706',
        },
        surface: {
          DEFAULT: '#FFFFFF', // White
          muted: '#F8FAFC',   // Off-white
          subtle: '#F1F5F9',
        },
        border: {
          DEFAULT: '#E2E8F0', // Light grey
          subtle: '#F1F5F9',
          strong: '#CBD5E1',
        },
        slate: {
          primary: '#0F172A', // Text Primary
          secondary: '#64748B', // Text Secondary
          muted: '#94A3B8',
        }
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
        'input': '12px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'floating': '0 10px 25px -5px rgba(79, 70, 229, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
