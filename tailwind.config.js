/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // UM6P Institutional palette
        um6p: {
          green: '#00843D',
          'green-dark': '#006B32',
          'green-light': '#4CAF7A',
          'green-pale': '#E8F5EE',
          gold: '#C8A951',
          'gold-light': '#F0DFA0',
          navy: '#1A2B4A',
          'navy-light': '#2D4A7A',
          gray: '#F5F6F8',
          'gray-dark': '#6B7280',
          border: '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.10)',
        modal: '0 20px 60px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
