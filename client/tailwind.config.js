/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        exam: {
          header: '#1e293b',
          headerDark: '#0f172a',
          bar: '#334155',
          accent: '#2563eb',
          accentHover: '#1d4ed8',
          success: '#15803d',
          warning: '#b45309',
          danger: '#b91c1c',
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#cbd5e1',
          text: '#0f172a',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Arial', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
