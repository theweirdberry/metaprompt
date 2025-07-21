// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Metaprompt',
  description: 'OpenAI Chat-inspired prompt tool',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen antialiased font-sans transition-colors duration-300">
        {children}
      </body>
    </html>
  )
}
