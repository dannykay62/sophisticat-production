import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#3D0B0B", // deep burgundy, brand dark neutral (was near-black for LUXORA)
          soft: "#4A1010",
        },
        cream: {
          DEFAULT: "#FAF7F1", // primary light background — matches the logo's background
          deep: "#F3E9DC", // secondary cream section
        },
        red: {
          50: "#FFEBEC",
          100: "#FFC2C6",
          200: "#FF8A93",
          300: "#FF525F",
          400: "#FF2D3D",
          500: "#FF073A", // neon red — primary brand accent
          600: "#E6002E",
          700: "#B80026",
        },
        gold: {
          50: "#FBF1DE",
          100: "#F0DBA0",
          200: "#DFBD6C",
          300: "#CBA050",
          400: "#C9A24B", // lighter champagne gold — icons, dividers
          500: "#A6701F", // deeper bronze-gold, sampled from the logo's ring
          600: "#8B5A18",
          700: "#6B4512",
        },
        stone: {
          line: "#E8DCCF", // hairline dividers on cream
          lineDark: "#5C2020", // hairline dividers on ink
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 5vw, 5rem)", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        "display-lg": ["clamp(2.25rem, 4vw, 3.5rem)", { lineHeight: "1.08", letterSpacing: "-0.01em" }],
        "display-md": ["clamp(1.75rem, 2.5vw, 2.5rem)", { lineHeight: "1.15" }],
        eyebrow: ["0.75rem", { lineHeight: "1", letterSpacing: "0.25em" }],
      },
      letterSpacing: {
        wide2: "0.15em",
        wide3: "0.25em",
      },
      maxWidth: {
        content: "1440px",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(14, 12, 9, 0.06)",
        card: "0 12px 40px rgba(14, 12, 9, 0.08)",
        gold: "0 8px 24px rgba(201, 162, 75, 0.25)",
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        wipe: {
          "0%": { transform: "scaleX(1)" },
          "100%": { transform: "scaleX(0)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        wipe: "wipe 1.1s cubic-bezier(0.83,0,0.17,1) forwards",
        fadeUp: "fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
