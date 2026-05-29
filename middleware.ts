import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

// Routes that require authentication
// Bar and Kitchen are open access - staff can use cashier login if needed
// Inventory and Analytics require cashier/admin access
const protectedRoutes = ['/admin', '/menu-management', '/cashier', '/inventory', '/analytics']

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  if (isProtectedRoute) {
    // Get the supabase session from the response cookies
    const supabase = response.cookies.get('sb-envaxqkxlrkfiniixspv-auth-token')
    
    if (!supabase) {
      // Redirect to login if no session
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
