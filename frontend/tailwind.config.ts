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
        background: "#0a0a0a",
        foreground: "#ffffff",
        brand: {
          DEFAULT: "#7c3aed",
          dark: "#6d28d9",
          light: "#a78bfa",
          accent: "#10b981",
        },
        cardBg: "#111111",
        borderBg: "#222222",
        hoverBg: "#1a1a1a",
        surface: "#161616",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
