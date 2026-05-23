/*
 * Tailwind CSS v4 note:
 * Theme values (colors, fonts) are defined via @theme in globals.css —
 * that is what generates the utility classes (bg-navy, text-cyan, font-terminal, etc.).
 * This file is kept for reference and future plugin configuration.
 */

const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:   '#050d1a',
        deep:   '#0a1628',
        mid:    '#0f2244',
        blue:   '#1a3a6e',
        bright: '#1e5eff',
        sky:    '#38b4ff',
        cyan:   '#00e5ff',
        glow:   '#4df0ff',
        pink:   '#ff6eb4',
        yellow: '#ffe566',
        mint:   '#5fffc8',
        white:  '#e8f4ff',
      },
      fontFamily: {
        pixel:    ['var(--font-press-start)', 'monospace'],
        terminal: ['var(--font-vt323)', 'monospace'],
        body:     ['var(--font-nunito)', 'sans-serif'],
      },
    },
  },
};

export default config;
