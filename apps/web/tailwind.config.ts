import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0A1224",
          blue: "#2F6BFF",
          cyan: "#43D3FF",
          slate: "#E9EEF8"
        },
        "riot-darkest": "#0F1923",
        "riot-dark": "#1F2933",
        "riot-darker": "#18242E",
        "accent-red": "#FF4655",
        "accent-cyan": "#0AC8B9",
        "accent-gold": "#D6AF37",
        "text-primary": "#ECE8E1",
        "text-secondary": "#C3BFB7",
        "text-tertiary": "#9A9590"
      },
      boxShadow: {
        "glow-red": "0 0 20px rgba(255, 70, 85, 0.5)",
        "glow-red-lg": "0 0 30px rgba(255, 70, 85, 0.6)",
        "glow-cyan": "0 0 15px rgba(10, 200, 184, 0.4)",
        "glow-inset": "0 0 30px rgba(255, 70, 85, 0.2) inset"
      },
      borderRadius: {
        DEFAULT: "4px"
      }
    }
  },
  plugins: []
} satisfies Config;
