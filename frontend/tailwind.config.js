/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: "#0B0F17",
          card: "#111827",
          cardHover: "#1F2937",
          border: "#1E293B",
          cyan: "#00d2ff",
          cyanGlow: "rgba(0, 210, 255, 0.4)",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E"
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
