import type { Metadata } from 'next'
import './globals.css'
import { SettingsProvider } from '@/components/SettingsProvider'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Auto Supply — Admin',
  description: 'Branch-aware auto parts management.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700&family=Saira:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SettingsProvider>{children}</SettingsProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--panel-2)',
              color: 'var(--chrome)',
              border: '1px solid var(--line)',
              fontFamily: 'var(--font-body)',
            },
          }}
        />
      </body>
    </html>
  )
}
