import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080808",
        brand: "#f97316",
        "brand-deep": "#ea580c",
      },
      fontFamily: {
        sans: ["var(--font-figtree)", "Arial", "sans-serif"],
        urbanist: ["var(--font-urbanist)", "Impact", "sans-serif"],
        display: ["var(--font-bebas)", "Impact", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
