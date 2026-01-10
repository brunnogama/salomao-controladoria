/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        salomao: {
          dark: '#0B2138', // Azul muito escuro do fundo direito
          blue: '#132D4E', // Azul do botão/logo
          gold: '#D4AF37', // Dourado da linha
          gray: '#F5F6F8', // Fundo claro dos inputs
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
