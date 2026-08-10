import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH !== 'false'

export default async function middleware(request: NextRequest) {
  // When auth is bypassed, just pass through — no Clerk middleware needed.
  if (BYPASS_AUTH) {
    return NextResponse.next()
  }

  // Dynamically import clerkMiddleware only when Clerk is actually enabled,
  // so the module (which requires a publishableKey) is never loaded in bypass mode.
  const { clerkMiddleware } = await import('@clerk/nextjs/server')
  return clerkMiddleware()(request, {} as any)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
