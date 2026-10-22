import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic tokens used by the shared UI components (Button, Badge,
        // ConfirmDialog, Toast, Form, sidebar). Without them Tailwind emits no
        // CSS for classes such as bg-primary or bg-destructive. Values come
        // from the palette the pages already use (primary-600, red-600, slate).
        background: "#ffffff",
        input: "#e2e8f0",
        // SeatPass teal (matches the mobile app). primary is the darker #0F766E
        // so white text on it passes WCAG AA (5.47:1); #0D9488 is only 3.74.
        ring: "#0d9488",
        // hover: a darker solid shade. A translucent hover (bg-*/90) lightens
        // the button and drops white text below WCAG AA (4.5:1).
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
          hover: "#b91c1c",
        },
        secondary: {
          DEFAULT: "#f1f5f9",
          foreground: "#0f172a",
        },
        accent: {
          DEFAULT: "#f1f5f9",
          foreground: "#0f172a",
        },
        muted: {
          foreground: "#475569",
        },
        primary: {
          DEFAULT: "#0f766e",
          foreground: "#ffffff",
          hover: "#115e59",
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        slate: {
          850: "#1e293b",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
