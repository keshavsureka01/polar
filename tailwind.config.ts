import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        polar: {
          ink: "#101828",
          frost: "#eff8ff",
          ice: "#b9e6fe",
          aurora: "#12b76a",
          warning: "#f79009",
          danger: "#d92d20"
        }
      },
      boxShadow: {
        panel: "0 18px 45px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
