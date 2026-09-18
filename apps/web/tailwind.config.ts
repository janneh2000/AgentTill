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
        arc: {
          50: "#eef9ff",
          100: "#d9f1ff",
          200: "#bce7ff",
          300: "#8ed8ff",
          400: "#59c0ff",
          500: "#339fff",
          600: "#1a7ff5",
          700: "#1469e1",
          800: "#1755b6",
          900: "#19498f",
          950: "#142d57",
        },
        ink: {
          950: "#070b14",
          900: "#0c1220",
          800: "#121a2b",
          700: "#1a2438",
          600: "#243049",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(51, 159, 255, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
