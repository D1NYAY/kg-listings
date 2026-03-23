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
        tg: {
          bg: "#1c1c1e",
          "bg-secondary": "#2c2c2e",
          "bg-tertiary": "#3a3a3c",
          text: "#ffffff",
          "text-secondary": "#ebebf5",
          hint: "#8e8e93",
          link: "#0a84ff",
          button: "#0a84ff",
          "button-text": "#ffffff",
        },
      },
    },
  },
  plugins: [],
};
export default config;
