/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0B3B63",
          orange: "#DD5736",
          orangeHover: "#C94D30",
          orangeActive: "#B64329",
          ink: "#111827",
          muted: "#6B7280",
          surface: "#FFFFFF",
          background: "#F5F7FA",
          surfaceSoft: "#F5F7FA",
          border: "#E5E7EB"
        },
        semantic: {
          success: "#1F9D55",
          warning: "#D18A00",
          error: "#C0392B",
          info: "#374151"
        },
        ink: "#111827",
        muted: "#6B7280",
        surface: "#FFFFFF",
        primary: "#0B3B63",
        accent: "#DD5736",
        background: "#F5F7FA",
        border: "#E5E7EB",
        success: "#1F9D55",
        warning: "#D18A00",
        error: "#C0392B"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 10px 24px rgba(15, 23, 42, 0.08)",
        header: "0 1px 0 rgba(15, 23, 42, 0.06)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem"
      },
      backgroundImage: {
        "brand-hero": "linear-gradient(135deg, #F5F7FA 0%, #FFFFFF 100%)",
        "brand-cta": "linear-gradient(135deg, #E35F3C 0%, #D64D2F 100%)"
      }
    }
  },
  plugins: []
};
