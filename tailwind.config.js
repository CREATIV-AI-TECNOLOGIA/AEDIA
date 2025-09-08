/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        school: {
          blue: "hsl(var(--school-blue))",
          "blue-dark": "hsl(var(--school-blue-dark))",
          "blue-light": "hsl(var(--school-blue-light))",
          sidebar: "hsl(var(--school-sidebar))",
          "sidebar-hover": "hsl(var(--school-sidebar-hover))",
          "sidebar-active": "hsl(var(--school-sidebar-active))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
    require('tailwindcss-animate'),
  ],
}