/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', 'monospace'],
      },
      colors: {
        terminal: {
          bg:      '#0d1117',
          panel:   '#161b22',
          border:  '#21262d',
          text:    '#c9d1d9',
          dim:     '#8b949e',
          dimmer:  '#484f58',
          blue:    '#58a6ff',
          green:   '#3fb950',
          yellow:  '#d29922',
          red:     '#f85149',
          purple:  '#bc8cff',
          cyan:    '#39d353',
          accent:  '#1f6feb',
        }
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s step-end infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        blink: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
        slideIn: { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
      }
    }
  },
  plugins: []
}
