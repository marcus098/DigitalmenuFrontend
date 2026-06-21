/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        success: {
          50:  '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        danger: {
          50:  '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        warning: {
          50:  '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        neutral: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        menu: {
          bg:           '#17140f',
          surface:      '#1e1b15',
          card:         '#25211a',
          'card-hover': '#2f2a21',
          text:         '#ede8da',
          muted:        '#8a7d6a',
          gold:         '#c9a84c',
        },
      },
      fontFamily: {
        sans:      ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        nunito:    ['Nunito', 'ui-sans-serif', 'sans-serif'],
        dm:        ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        modal: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        glow: '0 0 20px -4px rgba(249,115,22,0.5)',
        'glow-gold': '0 0 20px -4px rgba(201,168,76,0.5)',
        'menu-card': '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'shimmer-slide': 'shimmerSlide 2.2s linear infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'fade-up': 'menuFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards',
      },
      keyframes: {
        shimmerSlide: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        glowPulse: {
          '0%,100%': { opacity: '0.5' },
          '50%':     { opacity: '1' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}
