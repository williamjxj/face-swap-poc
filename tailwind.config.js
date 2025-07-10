const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'surface-primary',
    'surface-secondary',
    'surface-tertiary',
    'surface-elevated',
    'gradient-primary',
    'gradient-secondary',
    'gradient-accent',
    'text-primary',
    'text-secondary',
    'text-tertiary',
    'text-muted',
    'border-primary',
    'border-secondary',
    'border-accent',
    'btn-primary',
    'btn-secondary',
    'card-elevated',
    'glow-primary',
    'glow-accent',
    'scrollbar-thin',
    'focus-ring',
    'animate-shimmer',
    'animate-pulse',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Enhanced color system
        surface: {
          primary: 'rgb(var(--surface-primary))',
          secondary: 'rgb(var(--surface-secondary))',
          tertiary: 'rgb(var(--surface-tertiary))',
          elevated: 'rgb(var(--surface-elevated))',
        },
        text: {
          primary: 'rgb(var(--text-primary))',
          secondary: 'rgb(var(--text-secondary))',
          tertiary: 'rgb(var(--text-tertiary))',
          muted: 'rgb(var(--text-muted))',
        },
        border: {
          primary: 'rgb(var(--border-primary))',
          secondary: 'rgb(var(--border-secondary))',
          accent: 'rgb(var(--border-accent))',
        },
        gradient: {
          primary: {
            start: 'rgb(var(--primary-gradient-start))',
            end: 'rgb(var(--primary-gradient-end))',
          },
          secondary: {
            start: 'rgb(var(--secondary-gradient-start))',
            end: 'rgb(var(--secondary-gradient-end))',
          },
          accent: {
            start: 'rgb(var(--accent-gradient-start))',
            end: 'rgb(var(--accent-gradient-end))',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'indeterminate-progress': {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'pulse-opacity': {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 0.8 },
        },
        'bounce-delay': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'indeterminate-progress': 'indeterminate-progress 1.5s infinite ease-in-out',
        shimmer: 'shimmer 1.5s infinite linear',
        'pulse-opacity': 'pulse-opacity 2s infinite ease-in-out',
        'bounce-delay': 'bounce-delay 1.2s infinite ease-in-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
