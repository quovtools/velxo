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
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: "#8B5CF6", // Violet
          dark: "#6D28D9",
          light: "#A78BFA",
          accent: "#06B6D4", // Cyan
        },
        cardBg: "#111827", // Dark gray slate
        borderBg: "#1F2937",
        hoverBg: "#374151",
      },
    },
  },
  plugins: [],
};
export default config;
