import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        surface: "var(--surface)",
        border: "var(--border)",
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
          50: "rgb(var(--brand-50-rgb) / <alpha-value>)",
          100: "rgb(var(--brand-100-rgb) / <alpha-value>)",
          200: "rgb(var(--brand-200-rgb) / <alpha-value>)",
          300: "rgb(var(--brand-300-rgb) / <alpha-value>)",
          400: "rgb(var(--brand-400-rgb) / <alpha-value>)",
          500: "rgb(var(--brand-500-rgb) / <alpha-value>)",
          600: "rgb(var(--brand-600-rgb) / <alpha-value>)",
          700: "rgb(var(--brand-700-rgb) / <alpha-value>)",
          800: "rgb(var(--brand-800-rgb) / <alpha-value>)",
          light: "rgb(var(--brand-light-rgb) / <alpha-value>)",
          dark: "rgb(var(--brand-dark-rgb) / <alpha-value>)",
          accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          emerald: "#10b981",
        },
        card: "var(--surface)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: "0 0 40px rgba(0,0,0,0.35)",
        "glow-emerald": "0 0 40px rgba(16,185,129,0.25)",
        card: "0 20px 50px -20px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, rgb(var(--brand-rgb)) 0%, rgb(var(--accent-rgb)) 100%)",
        "brand-radial":
          "radial-gradient(900px 500px at 50% -10%, rgba(120,120,120,0.18), transparent 60%)",
        "grid-faint":
          "linear-gradient(to right, rgba(128,128,128,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.08) 1px, transparent 1px)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          from: { boxShadow: "0 0 20px rgba(0,0,0,0.25)" },
          to: { boxShadow: "0 0 40px rgba(0,0,0,0.45)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "0.7" },
          "70%": { transform: "scale(1.3)", opacity: "0" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.6s ease-out",
        marquee: "marquee 28s linear infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
