// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Definiamo il tuo colore brand come 'primary'
        'primary': '#fb923c',
        // Puoi anche definire una versione più scura per gli hover, se vuoi
        'primary-dark': '#f97316', // Esempio: un arancione leggermente più scuro
      }
    },
  },
  plugins: [],
}