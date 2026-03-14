import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        foreground: '#fafafa',
        card: '#171717',
        'card-foreground': '#fafafa',
        primary: '#3b82f6',
        'primary-foreground': '#fafafa',
        secondary: '#262626',
        'secondary-foreground': '#a3a3a3',
        muted: '#262626',
        'muted-foreground': '#a3a3a3',
        accent: '#3b82f6',
        'accent-foreground': '#fafafa',
        destructive: '#ef4444',
        'destructive-foreground': '#fafafa',
        border: '#262626',
        input: '#262626',
        ring: '#3b82f6',
      },
    },
  },
  plugins: [],
}
export default config