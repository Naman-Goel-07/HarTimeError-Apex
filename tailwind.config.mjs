/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        carbon: {
          900: "#0a0a0a",
          800: "#121212",
          700: "#1a1a1a",
          600: "#222222",
        },
        apex: {
          red: "#ff3333",
          green: "#00ff66",
          cyan: "#00eeff",
          yellow: "#ffcc00",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
export default config;
