export default {
  content: ["./index.html", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#030304",
        accent: "#4f7cff",
        accentHover: "#698fff",
        orangeAccent: "#ff7a18"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    }
  },
  plugins: []
}
