/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        samsung: {
          blue: '#0a60ff',      // Official SmartThings Blue
          darkBlue: '#004ecb',  // Hover states
          lightBlue: '#e6f0ff', // Light highlights
          gray: '#f4f6fa',      // Soft layout gray background
          dark: '#1c1e21',      // Premium slate dark text/elements
          grayText: '#68717a',  // Subtle sub-text
          cardBorder: '#e5e8eb', // Clean card boundaries
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'samsung-card': '0 4px 20px rgba(0, 0, 0, 0.02)',
        'samsung-hover': '0 10px 30px rgba(0, 0, 0, 0.06)',
        'drawer': '-10px 0 30px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
