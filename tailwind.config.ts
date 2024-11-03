import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/containers/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,t s,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    forms
  ],
}