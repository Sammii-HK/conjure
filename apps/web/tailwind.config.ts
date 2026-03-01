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
        background: "#0a0a0f",
        card: "#12121a",
        accent: "#7c3aed",
        "accent-hover": "#6d28d9",
        "accent-muted": "#4c1d95",
        text: "#e2e8f0",
        "text-muted": "#94a3b8",
        border: "#1e1e2e",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
