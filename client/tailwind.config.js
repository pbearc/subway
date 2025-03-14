/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        subway: {
          green: "#006341",
          yellow: "#FFCE00",
        },
      },
    },
  },
  plugins: [],
};
