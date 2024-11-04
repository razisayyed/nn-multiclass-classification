import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/containers/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,t s,jsx,tsx,mdx}",
  ],
  safelist: [
    {
      pattern: /fill-.*-300/,
    },
  ],

  theme: {
    extend: {},
  },
  plugins: [
    forms
  ],
}