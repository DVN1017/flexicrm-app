/**
 * Tailwind configuration for the design system tokens used by the authentication module.
 * Colors are expressed as semantic tokens rather than hardcoded values to keep the UI consistent
 * and future-proof across the product.
 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#1D4ED8",
          foreground: "#FFFFFF",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          500: "#3B82F6",
          600: "#2563EB",
        },
        secondary: {
          DEFAULT: "#0F172A",
          foreground: "#F8FAFC",
        },
        text: "#0F172A",
        muted: "#475569",
        border: "#E2E8F0",
        error: "#DC2626",
        success: "#15803D",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
