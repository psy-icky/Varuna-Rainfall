/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        varuna: {
          bg: "#0B0F19",
          card: "#111827",
          border: "#1F2937",
          subtle: "#374151",
          text: "#F9FAFB",
          muted: "#9CA3AF",
          accent: "#06B6D4",      // Cyan
          teal: "#14B8A6",
          amber: "#F59E0B",
          red: "#EF4444",
          blue: "#3B82F6",
          green: "#10B981"
        }
      }
    },
  },
  plugins: [],
}
