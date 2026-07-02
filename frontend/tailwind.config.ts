import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
        },
        parchment: 'var(--parchment)',
        card: 'var(--card)',
        brass: {
          DEFAULT: 'var(--brass)',
          deep: 'var(--brass-deep)',
          tint: 'var(--brass-tint)',
        },
        harbor: 'var(--harbor)',
        sea: {
          DEFAULT: 'var(--sea)',
          tint: 'var(--sea-tint)',
        },
        coral: {
          DEFAULT: 'var(--coral)',
          tint: 'var(--coral-tint)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
        },
        passport: 'var(--passport-bg)',
        'stat-sessions': 'var(--stat-sessions-bg)',
        locked: {
          bg: 'var(--locked-bg)',
          border: 'var(--locked-border)',
          icon: 'var(--locked-icon-bg)',
        },
        topic: 'var(--topic-bg)',
        progress: 'var(--progress-bg)',
        chip: {
          bg: 'var(--chip-bg)',
          hover: 'var(--chip-hover)',
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
        serif: ["var(--font-fraunces)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
