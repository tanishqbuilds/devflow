import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { ClerkProvider } from '@clerk/nextjs'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://devflow.ai'),
  title: {
    default: 'Devflow — Ship the plan before you write the first line of code',
    template: '%s · Devflow',
  },
  description:
    'Devflow is an AI organization — PM, architect, estimation and risk agents — that turns one idea into a complete software delivery plan: requirements, backlog, milestones, team, cost and risks. Free to start.',
  keywords: [
    'AI project planning', 'SDLC automation', 'AI product manager', 'software delivery plan',
    'AI sprint planning', 'project estimation', 'requirements generator', 'Devflow',
  ],
  authors: [{ name: 'Devflow' }],
  openGraph: {
    title: 'Devflow — Turn one idea into a complete software plan',
    description:
      'An AI organization that drafts your requirements, backlog, milestones, team, cost and risks in minutes. Free to start, no credit card.',
    url: 'https://devflow.ai',
    siteName: 'Devflow',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Devflow — Ship the plan before you write code',
    description: 'An AI org that turns one idea into a full delivery plan in minutes.',
  },
  generator: 'Devflow',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#050816',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className="font-sans antialiased bg-background text-foreground">
        <ClerkProvider afterSignOutUrl="/">
          <AuthProvider>{children}</AuthProvider>
        </ClerkProvider>
        {process.env.VERCEL === '1' && <Analytics />}
      </body>
    </html>
  )
}
