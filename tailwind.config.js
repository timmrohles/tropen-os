/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light Tremor theme (unused – app is always dark)
        tremor: {
          brand: {
            faint: '#f0fdfa',
            muted: '#ccfbf1',
            subtle: '#5eead4',
            DEFAULT: '#14b8a6',
            emphasis: '#0f766e',
            inverted: '#ffffff'
          },
          background: {
            muted: '#131A2B',
            subtle: '#1e293b',
            DEFAULT: '#0f172a',
            emphasis: '#d1d5db'
          },
          border: { DEFAULT: '#2a2a2a' },
          ring: { DEFAULT: '#2a2a2a' },
          content: {
            subtle: '#6b7280',
            DEFAULT: '#9ca3af',
            emphasis: '#e5e7eb',
            strong: '#f9fafb',
            inverted: '#000000'
          }
        },
        // Dark Tremor theme – zinc palette + teal accent
        'dark-tremor': {
          brand: {
            faint: '#042f2e',
            muted: '#134e4a',
            subtle: '#0f766e',
            DEFAULT: '#14b8a6',
            emphasis: '#2dd4bf',
            inverted: '#ffffff'
          },
          background: {
            muted: '#09090b',    // zinc-950  (page bg)
            subtle: '#27272a',   // zinc-800
            DEFAULT: '#18181b',  // zinc-900  (card bg)
            emphasis: '#d4d4d8'  // zinc-300
          },
          border: { DEFAULT: '#27272a' },  // zinc-800
          ring: { DEFAULT: '#27272a' },
          content: {
            subtle: '#71717a',   // zinc-500
            DEFAULT: '#a1a1aa',  // zinc-400
            emphasis: '#e4e4e7', // zinc-200
            strong: '#fafafa',   // zinc-50
            inverted: '#000000'
          }
        }
      }
    }
  },
  plugins: []
}
