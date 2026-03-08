/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: { DEFAULT: '#09090b', paper: '#121212', subtle: '#18181b' },
        foreground: { DEFAULT: '#ffffff', muted: '#a1a1aa', dim: '#52525b' },
        primary: { DEFAULT: '#22c55e', foreground: '#000000', hover: '#16a34a' },
        secondary: { DEFAULT: '#27272a', foreground: '#ffffff' },
        accent: { DEFAULT: '#3b82f6', foreground: '#ffffff' },
        destructive: { DEFAULT: '#ef4444', foreground: '#ffffff' },
        border: '#27272a',
        input: '#27272a',
        ring: '#22c55e',
      },
      fontFamily: {
        heading: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
