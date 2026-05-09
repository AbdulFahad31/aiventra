import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#f5f5f5",
        surface: "#121212",
        elevated: "#1a1a1a",
        border: "#2d1515",
        muted: "#b0b0b0",
        accent: {
          blue: "#dc2626",
          hover: "#b91c1c",
          subtle: "rgba(220,38,38,0.12)"
        },
        status: {
          success: "#22c55e",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#86efac"
        }
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.3)",
        elevated: "0 2px 8px rgba(0,0,0,0.4)"
      },
      backgroundImage: {
        "app-base": "linear-gradient(180deg, #0a0a0a 0%, #1a0f0f 100%)"
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-120%)" },
          "100%": { transform: "translateY(120%)" }
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        scan: "scan 2.8s ease-in-out infinite",
        pulseGlow: "pulseGlow 2.2s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;

