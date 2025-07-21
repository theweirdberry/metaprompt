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
    <html lang="en" className="dark"> {/* 필요 시 className 제거하고 next-themes 도입 가능 */}
      <body className="bg-background text-foreground min-h-screen antialiased font-sans transition-colors duration-300">
        {children}
      </body>
    </html>
  )
}
