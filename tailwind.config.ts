import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── Semantic theme tokens (flip between light/dark via CSS vars) ──
        // Defined in globals.css under :root and .dark. Use these for any
        // surface that should adapt to the active theme.
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: 'hsl(var(--card) / <alpha-value>)',
        'card-foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        link: 'hsl(var(--link) / <alpha-value>)',
        gold: 'hsl(var(--gold) / <alpha-value>)',
        // Home page - Dark mode (navy)
        dark: {
          bg: 'hsl(214 68% 14%)',
          surface: 'hsl(213 64% 18%)',
          text: 'hsl(44 52% 90%)',
          muted: 'rgba(243,236,217,0.6)',
        },
        // Tours page - Light mode (golden)
        light: {
          bg: 'hsl(44 66% 92%)',
          surface: 'hsl(45 86% 97%)',
          text: 'hsl(214 68% 14%)',
          muted: 'hsl(45 20% 35%)',
          border: 'hsl(42 48% 82%)',
        },
        // Brand colors (shared)
        green: {
          brand: 'hsl(151 87% 34%)',
          deep: 'hsl(160 60% 8%)',
          bright: 'hsl(150 78% 39%)',
          glow: 'hsl(150 75% 48%)',
        },
        navy: {
          brand: 'hsl(214 68% 14%)',
          soft: 'hsl(213 64% 18%)',
        },
        // Retired: orange → gold, cyan → blue (values repointed so legacy
        // utility classes stay on-brand without per-component edits).
        orange: {
          brand: 'hsl(43 49% 53% / <alpha-value>)',
        },
        cyan: {
          brand: 'hsl(214 88% 34% / <alpha-value>)',
        },
        cream: 'hsl(45 86% 97%)',
        // Tours specific
        brand: {
          navy:   'hsl(214 68% 14% / <alpha-value>)',
          gold:   'hsl(43 49% 53% / <alpha-value>)',
          blue:   'hsl(214 88% 34% / <alpha-value>)',
          green: 'hsl(158 55% 26%)',
          green2: 'hsl(152 60% 32%)',
          bright: 'hsl(151 70% 38%)',
          mint:   'hsl(140 45% 80%)',
          ink: 'hsl(214 68% 14%)',
          mute: 'hsl(45 20% 35%)',
          page: 'hsl(44 66% 92%)',
          line: 'hsl(42 48% 82%)',
          dark: 'hsl(214 68% 10%)',
          cream:  'hsl(45 86% 97%)',
          sand:   'hsl(43 55% 87%)',
        },
        badge: {
          orange: 'hsl(43 49% 53%)',
          blue: 'hsl(214 88% 34%)',
          green: 'hsl(151 70% 38%)',
        },
      },
      boxShadow: {
        glass: '0 24px 70px -24px rgba(0,0,0,.6)',
        glow: '0 0 40px -8px hsl(151 87% 34% / .45)',
        card: '0 20px 50px -20px rgba(11,31,58,.45)',
        soft: '0 8px 30px -12px rgba(11,31,58,.14)',
        'card-tours': '0 14px 36px -16px rgba(11,31,58,.18)',
        gold: '0 0 36px -10px hsl(43 49% 53% / .5)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;