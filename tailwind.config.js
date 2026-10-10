/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vyapar Primary Green
        primary: {
          DEFAULT: '#1DB450',
          light: '#E8F9EE',
          hover: '#18A047',
          dark: '#137835',
        },
        moneyIn: {
          DEFAULT: '#1DB450',
          tint: '#E8F9EE',
          hover: '#18A047',
          dark: '#137835',
        },
        moneyOut: {
          DEFAULT: '#F24645',
          tint: '#FEF0F0',
          hover: '#DC3534',
          dark: '#B02120',
        },
        warning: {
          DEFAULT: '#FF9800',
          tint: '#FFF3E0',
          hover: '#E68900',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F5F7FA',
          subtle: '#F0F2F5',
        },
        border: {
          DEFAULT: '#E5E8ED',
          subtle: '#F0F2F5',
          strong: '#CDD0D8',
        },
        slate: {
          primary: '#1A1D23',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        vyapar: {
          green: '#1DB450',
          'green-dark': '#137835',
          'green-light': '#E8F9EE',
          orange: '#FF9800',
          red: '#F24645',
          blue: '#1A73E8',
          purple: '#7C3AED',
          header: '#1A1D23',
        }
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'input': '8px',
        'chip': '20px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 4px 0 rgba(0,0,0,0.08)',
        'elevated': '0 2px 8px 0 rgba(0,0,0,0.12)',
        'floating': '0 8px 24px 0 rgba(29,180,80,0.15), 0 4px 8px 0 rgba(0,0,0,0.1)',
        'nav': '0 -1px 6px 0 rgba(0,0,0,0.08)',
        'header': '0 1px 4px 0 rgba(0,0,0,0.15)',
      }
    },
  },
  plugins: [],
}
