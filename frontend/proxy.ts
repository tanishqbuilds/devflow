import { clerkMiddleware } from '@clerk/nextjs/server'

// Authentication is made available globally here. Authorization stays next to
// the protected data: the FastAPI backend verifies every Clerk token and scopes
// all project queries by user ID.
export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
