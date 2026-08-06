import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        mint: "var(--mint)",
        ink: "var(--ink)",
      },
    },
  },
  plugins: [],
};

export default config;
