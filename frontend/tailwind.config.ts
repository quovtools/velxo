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
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
          dark: "rgb(var(--brand-dark-rgb) / <alpha-value>)",
          light: "rgb(var(--brand-light-rgb) / <alpha-value>)",
          accent: "rgb(var(--brand-accent-rgb) / <alpha-value>)",
        },
        cardBg: "var(--card-bg)",
        borderBg: "var(--border-bg)",
        hoverBg: "var(--hover-bg)",
        // Override the default purple scale so the old "purple" brand
        // gradients render as monochrome grays instead of blue/purple.
        purple: {
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          900: "#171717",
        },
        // Seller level colors
        bronze: { DEFAULT: '#cd7f32', light: '#e8a85f', dark: '#a0622a' },
        silver: { DEFAULT: '#c0c0c0', light: '#d8d8d8', dark: '#9a9a9a' },
        gold:   { DEFAULT: '#ffd700', light: '#ffe44d', dark: '#ccac00' },
        elite:  { DEFAULT: '#a855f7', light: '#c084fc', dark: '#7e22ce' },
      },
    },
  },
  plugins: [],
};
export default config;
