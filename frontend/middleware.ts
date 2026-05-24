import { NextResponse } from 'next/server'

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default async function middleware(req: any, event: any) {
  if (!isClerkConfigured) {
    return NextResponse.next()
  }

  try {
    // Dynamic import to prevent Clerk from throwing an error during server startup if keys are not set
    const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server')
    const isProtectedRoute = createRouteMatcher(['/workspace(.*)'])
    
    return clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) await auth.protect()
    })(req, event)
  } catch (e) {
    console.error('Failed to run Clerk middleware', e)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.[\\w]+$|_next/image|favicon.ico).*)',
    '/(api|trpc)(.*)',
  ],
}
