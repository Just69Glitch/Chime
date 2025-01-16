/** @type {import("tailwindcss").Config} */


const textColor = { 50: "#eaeffa", 100: "#d6e0f5", 200: "#acc0ec", 300: "#83a1e2", 400: "#5a82d8", 500: "#3063cf", 600: "#274fa5", 700: "#1d3b7c", 800: "#132753", 900: "#0a1429", 950: "#050a15", };
const backgroundColor = { 50: "#ebedfa", 100: "#d6dbf5", 200: "#adb8eb", 300: "#8594e0", 400: "#5c70d6", 500: "#334dcc", 600: "#293da3", 700: "#1f2e7a", 800: "#141f52", 900: "#0a0f29", 950: "#050814", };
const primaryColor = { 50: "#eaf0fa", 100: "#d5e0f6", 200: "#acc1ec", 300: "#82a2e3", 400: "#5984d9", 500: "#2f65d0", 600: "#2651a6", 700: "#1c3c7d", 800: "#132853", 900: "#09142a", 950: "#050a15" };
const secondaryColor = { 50: "#faf2ea", 100: "#f6e5d5", 200: "#eccbac", 300: "#e3b182", 400: "#d99759", 500: "#d07d2f", 600: "#a66426", 700: "#7d4b1c", 800: "#533213", 900: "#2a1909", 950: "#150c05", };
const accentColor = { 50: "#f4faea", 100: "#e9f6d5", 200: "#d2ecac", 300: "#bce382", 400: "#a6d959", 500: "#90d02f", 600: "#73a626", 700: "#567d1c", 800: "#395313", 900: "#1d2a09", 950: "#0e1505", };

module.exports = {
  content: ["./src/renderer/html/*.html", "./src/renderer/src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        text: textColor,
        background: backgroundColor,
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
        stylishArabic: ["var(--font-stylish-arabic)"],
      },
      transitionProperty: {
        "background-color":
          "background-color, border-color, fill, stroke, text-decoration-color",
      },
    },
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1rem" }],
      sm: ["0.875rem", { lineHeight: "1.25rem" }],
      base: ["1rem", { lineHeight: "1.5rem" }],
      lg: ["1.125rem", { lineHeight: "1.75rem" }],
      xl: ["1.25rem", { lineHeight: "1.75rem" }],
      "2xl": [
        "clamp(1.5rem, 1.3rem + 1vw, 1.875rem)",
        { lineHeight: "2.25rem" },
      ],
      "3xl": [
        "clamp(1.875rem, 1.5rem + 1.875vw, 2.25rem)",
        { lineHeight: "2.5rem" },
      ],
      "4xl": [
        "clamp(2.25rem, 1.875rem + 2.5vw, 3rem)",
        { lineHeight: "2.75rem" },
      ],
      "5xl": ["clamp(3rem, 2.5rem + 3.125vw, 3.75rem)", { lineHeight: "1" }],
      "6xl": ["clamp(3.75rem, 3.125rem + 3.75vw, 4.5rem)", { lineHeight: "1" }],
      "7xl": [
        "clamp(4.5rem, 3.75rem + 4.375vw, 5.625rem)",
        { lineHeight: "1" },
      ],
      "8xl": ["clamp(5.625rem, 4.5rem + 5vw, 7rem)", { lineHeight: "1" }],
      "heading-hero": [
        "clamp(3rem, 2.5rem + 3.125vw, 3.75rem)",
        { lineHeight: "1.1" },
      ],
      "heading-1": [
        "clamp(2.25rem, 1.875rem + 2.5vw, 3rem)",
        { lineHeight: "1.2" },
      ],
      "heading-2": [
        "clamp(1.875rem, 1.5rem + 1.875vw, 2.25rem)",
        { lineHeight: "1.3" },
      ],
      "body-large": [
        "clamp(1.125rem, 1rem + 0.625vw, 1.25rem)",
        { lineHeight: "1.5" },
      ],
      body: ["1rem", { lineHeight: "1.5" }],
      "body-small": ["0.875rem", { lineHeight: "1.5" }],
    },
  },
  plugins: [],
}

