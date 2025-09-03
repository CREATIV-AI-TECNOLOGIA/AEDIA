/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Araruama - usando override das cores padrão do Tailwind
        blue: {
          50: '#f0f8ff',   // Azul muito claro inspirado na lagoa
          100: '#e0f2ff',  // Azul claro
          200: '#bae5ff',  // Azul suave
          300: '#7dd3fc',  // Azul médio claro
          400: '#38bdf8',  // Azul interativo
          500: '#0ea5e9',  // Azul principal da lagoa
          600: '#0284c7',  // Azul médio escuro
          700: '#0369a1',  // Azul escuro da logo
          800: '#1e3a8a',  // Azul muito escuro
          900: '#1e293b',  // Azul profundo
        },
        orange: {
          50: '#fff7ed',   // Laranja muito claro
          100: '#ffedd5',  // Laranja claro
          200: '#fed7aa',  // Laranja suave
          300: '#fdba74',  // Laranja médio claro
          400: '#fb923c',  // Laranja interativo
          500: '#f97316',  // Laranja principal da educação
          600: '#ea580c',  // Laranja médio escuro
          700: '#c2410c',  // Laranja escuro
          800: '#9a3412',  // Laranja muito escuro
          900: '#7c2d12',  // Laranja profundo
        },
        // Manter cores padrão para compatibilidade
        primary: {
          50: '#f0f8ff',
          100: '#e0f2ff',
          200: '#bae5ff',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#1e3a8a',
          900: '#1e293b',
        },
        secondary: {
          50: '#fff7ed',
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
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 5px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'slideIn': 'slideIn 0.3s ease-in-out',
        'drawLine': 'drawLine 1.5s ease-in-out forwards',
        'bounce-subtle': 'bounce-subtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        drawLine: {
          '0%': { strokeDashoffset: '500' },
          '100%': { strokeDashoffset: '0' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      transitionProperty: {
        'width': 'width',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
  ],
} 