import type { Config } from 'tailwindcss';

const config: Config = {
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
        // Home page - Dark mode
        dark: {
          bg: 'hsl(200 50% 6%)',
          surface: 'hsl(200 50% 8%)',
          text: '#ffffff',
          muted: 'rgba(255,255,255,0.6)',
        },
        // Tours page - Light mode
        light: {
          bg: 'hsl(150 20% 98%)',
          surface: '#ffffff',
          text: 'hsl(200 25% 12%)',
          muted: 'hsl(206 12% 45%)',
          border: 'hsl(150 12% 90%)',
        },
        // Brand colors (shared)
        green: {
          brand: 'hsl(152 56% 40%)',
          deep: 'hsl(160 60% 8%)',
          bright: 'hsl(150 65% 46%)',
          glow: 'hsl(150 80% 55%)',
        },
        navy: {
          brand: 'hsl(200 50% 6%)',
          soft: 'hsl(204 40% 10%)',
        },
        orange: {
          brand: 'hsl(22 92% 56%)',
        },
        cyan: {
          brand: 'hsl(188 85% 52%)',
        },
        cream: 'hsl(40 30% 96%)',
        // Tours specific
        brand: {
          green: 'hsl(158 55% 22%)',
          green2: 'hsl(152 50% 32%)',
          bright: 'hsl(150 55% 40%)',
          mint:   'hsl(140 45% 80%)',
          ink: 'hsl(200 25% 12%)',
          mute: 'hsl(206 12% 45%)',
          page: 'hsl(150 20% 98%)',
          line: 'hsl(150 12% 90%)',
          dark: 'hsl(180 20% 5%)',
          cream:  'hsl(35 45% 96%)',
          sand:   'hsl(35 35% 90%)',
        },
        badge: {
          orange: 'hsl(24 95% 53%)',
          blue: 'hsl(205 90% 55%)',
          green: 'hsl(150 55% 42%)',
        },
      },
      boxShadow: {
        glass: '0 24px 70px -24px rgba(0,0,0,.6)',
        glow: '0 0 40px -8px hsl(150 70% 45% / .5)',
        card: '0 20px 50px -20px rgba(0,0,0,.55)',
        soft: '0 8px 30px -12px rgba(15,40,30,.12)',
        'card-tours': '0 14px 36px -16px rgba(15,40,30,.18)',
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