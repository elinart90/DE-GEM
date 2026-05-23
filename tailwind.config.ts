import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Industrial dark palette — driven by CSS vars so settings/theming can override later
        ink:    'var(--ink)',      // page background, near-black
        panel:  'var(--panel)',    // surfaces
        panel2: 'var(--panel-2)',  // raised surfaces
        line:   'var(--line)',     // borders
        steel:  'var(--steel)',    // muted text
        chrome: 'var(--chrome)',   // primary text
        amber:  'var(--amber)',    // safety-amber accent
        amberd: 'var(--amber-dim)',
        oxide:  'var(--oxide)',    // secondary accent (oxide red)
        ok:     'var(--ok)',
        warn:   'var(--warn)',
        bad:    'var(--bad)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      borderRadius: { sm: '3px', DEFAULT: '5px', md: '7px', lg: '10px' },
    },
  },
  plugins: [],
}
export default config
