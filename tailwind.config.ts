import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        console: {
          950: "#0A0D10",
          900: "#12161B",
          850: "#171C22",
          800: "#1D232B",
          line: "#252C34",
          "line-bright": "#333C46",
        },
        signal: {
          DEFAULT: "#5EEAD4",
          dim: "#2E9E8F",
          soft: "rgba(94, 234, 212, 0.12)",
        },
        warn: {
          DEFAULT: "#F0725A",
          soft: "rgba(240, 114, 90, 0.12)",
        },
        ink: {
          DEFAULT: "#E7ECEF",
          muted: "#8A97A0",
          faint: "#5B6570",
        },
      },
      fontFamily: {
        sans: ["var(--font-ui)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(255,255,255,0.03), 0 20px 60px -20px rgba(0,0,0,0.6)",
      },
      keyframes: {
        sweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        sweep: "sweep 1.8s ease-in-out infinite",
        blink: "blink 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
