import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import localFont from 'next/font/local'
import { AuthProvider } from '@/hooks/useAuth'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const bespokeSerif = localFont({
  src: [
    { path: '../public/fonts/BespokeSerif-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/BespokeSerif-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SOMOS Civic Lab - AI Red-Teaming Platform',
  description: 'Democratizing AI governance through structured public participation in red teaming exercises',
  viewport: {
    width: 'device-width',
    initialScale: 1.0,
    maximumScale: 1.0,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
      </head>
      <body className={`${spaceGrotesk.variable} ${bespokeSerif.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
