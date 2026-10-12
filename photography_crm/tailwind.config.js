/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'Noto Color Emoji', 'sans-serif'],
        serif: ['Frank Ruhl Libre', 'Noto Color Emoji', 'serif'],
      },
    },
  },
  plugins: [],
}
