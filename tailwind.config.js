/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'arabic': ['Noto Sans Arabic', 'Amiri', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'primary': '#667eea',
        'secondary': '#764ba2',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}