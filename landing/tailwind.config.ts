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
        background: "#0b0f19",
        foreground: "#f8fafc",
        surface: "#111827",
        border: "#1F2937",
        brand: {
          DEFAULT: "#7C3AED",
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5b21b6",
          light: "#A78BFA",
          dark: "#6D28D9",
          accent: "#06B6D4",
        },
        accent: {
          DEFAULT: "#06B6D4",
          emerald: "#10b981",
        },
        card: "#111827",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: "0 0 40px rgba(124,58,237,0.35)",
        "glow-emerald": "0 0 40px rgba(16,185,129,0.25)",
        card: "0 20px 50px -20px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
        "brand-radial":
          "radial-gradient(900px 500px at 50% -10%, rgba(124,58,237,0.18), transparent 60%)",
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          from: { boxShadow: "0 0 20px rgba(124,58,237,0.25)" },
          to: { boxShadow: "0 0 40px rgba(124,58,237,0.55)" },
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
