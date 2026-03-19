/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medicare: {
          blue: "#1B2559",
          muted: "#A3AED0",
          bg: "#f4f7fe"
        }
      }
    },
  },
  plugins: [],
}