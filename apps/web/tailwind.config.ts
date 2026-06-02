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
        ds: {
          page: "#05080C",
          "page-soft": "#080D12",
          surface: "#0E151C",
          "surface-strong": "#121B24",
          red: "#FF2438",
          "red-deep": "#B90F24",
          cyan: "#18E6F2",
          "cyan-deep": "#0796A8",
          gold: "#FFB21A",
          primary: "#F5F7FA",
          secondary: "#B4BEC8",
          muted: "#6D7886",
          "border-soft": "rgba(255, 255, 255, 0.08)",
          "border-strong": "rgba(255, 255, 255, 0.14)"
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
        "glow-inset": "0 0 30px rgba(255, 70, 85, 0.2) inset",
        "ds-card": "0 16px 40px rgba(0, 0, 0, 0.35)",
        "ds-panel": "0 24px 80px rgba(0, 0, 0, 0.42)",
        "ds-red-glow": "0 0 24px rgba(255, 36, 56, 0.35)",
        "ds-cyan-glow": "0 0 24px rgba(24, 230, 242, 0.25)"
      },
      borderRadius: {
        DEFAULT: "4px",
        "ds-xs": "6px",
        "ds-sm": "8px",
        "ds-md": "12px",
        "ds-lg": "16px",
        "ds-xl": "20px",
        "ds-2xl": "24px"
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Oxanium", "sans-serif"],
        body: ["var(--font-body)", "Sora", "sans-serif"]
      },
      backgroundImage: {
        "ds-radial-red": "radial-gradient(circle at 78% 18%, rgba(255,36,56,0.22), transparent 28%)",
        "ds-radial-cyan": "radial-gradient(circle at 18% 0%, rgba(24,230,242,0.16), transparent 26%)",
        "ds-panel": "linear-gradient(180deg, rgba(18,27,36,0.96), rgba(8,13,18,0.88))"
      },
      keyframes: {
        "ds-fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "ds-pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 18px rgba(255, 36, 56, 0.22)" },
          "50%": { boxShadow: "0 0 30px rgba(24, 230, 242, 0.24)" }
        }
      },
      animation: {
        "ds-fade-up": "ds-fade-up 0.55s ease both",
        "ds-pulse-glow": "ds-pulse-glow 3s ease-in-out infinite"
      }
    }
  },
  plugins: []
} satisfies Config;
