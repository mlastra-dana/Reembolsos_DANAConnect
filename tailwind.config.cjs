/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#003A70",
        accent: "#00A3E0",
        background: "#f3f4f6",
        success: "#16a34a",
        warning: "#f59e0b",
        error: "#dc2626"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 10px 25px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xl: "1rem"
      }
    }
  },
  plugins: []
};

