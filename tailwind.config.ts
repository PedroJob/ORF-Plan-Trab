import type { Config } from "tailwindcss";

export default {
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
        // Paleta Verde Oliva Militar
        military: {
          50: '#f4f6f3',
          100: '#e5e9e2',
          200: '#cbd4c4',
          300: '#a8b89d',
          400: '#869b76',
          500: '#6b805b',  // Verde oliva principal
          600: '#556647',
          700: '#44503a',
          800: '#394231',
          900: '#30372a',
          950: '#1a1f16',
        },
        olive: {
          50: '#f7f8f6',
          100: '#eef0ec',
          200: '#d9ddd4',
          300: '#bbc4b3',
          400: '#9aa68d',
          500: '#7d8b6f',
          600: '#637157',
          700: '#4f5a47',
          800: '#414a3b',
          900: '#383f33',
          950: '#1d211a',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
