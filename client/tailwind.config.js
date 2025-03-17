/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Subway brand colors
        "subway-green": "#006341",
        "subway-yellow": "#FFC600",

        // Application-specific colors
        primary: {
          DEFAULT: "#006341", // Subway green as primary
          light: "#2D8D6D",
          dark: "#004D32",
        },
        secondary: {
          DEFAULT: "#FFC600", // Subway yellow as secondary
          light: "#FFD133",
          dark: "#DDA800",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 2px 4px rgba(0, 0, 0, 0.1)",
        dropdown:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      animation: {
        "bounce-small": "bounce-small 1s infinite",
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "bounce-small": {
          "0%, 100%": { transform: "translateY(-5%)" },
          "50%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true, // Enable Tailwind's base styles for consistency
  },
};
