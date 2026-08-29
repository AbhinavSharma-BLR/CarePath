/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#EF3030',
          hover: '#D92727',
          dark: '#B91C1C',
          light: '#FEE2E2',
          foreground: '#FFFFFF',
        },
        darkBg: '#080808',
        darkSurface: '#111111',
        darkCard: '#171717',
        darkBorder: '#2A2A2A',
        lightBg: '#F7F7F7',
        offWhite: '#FAFAFA',
        lightGray: '#F5F5F5',
        queueBg: '#FFF8F5',
        queueBorder: '#E5DAD4',
        neutralText: {
          primary: '#111111',
          secondary: '#666666',
          muted: '#999999',
        },
        borderCare: {
          DEFAULT: '#E5E5E5',
          dark: '#2A2A2A',
        },
        success: {
          DEFAULT: '#16A34A',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#F59E0B',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
