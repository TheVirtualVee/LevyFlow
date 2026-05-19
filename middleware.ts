import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Rate Limiter logic for critical student API endpoints
  const pathname = req.nextUrl.pathname
  const isCriticalApi = 
    pathname.includes('/register') || 
    pathname.includes('/validate-token') || 
    (pathname.includes('/sessions') && req.method === 'POST')

  if (isCriticalApi) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || '127.0.0.1'
    
    // Call Postgres atomic rate-limiting function
    const { data: isLimited } = await supabase.rpc('check_rate_limit', {
      p_ip: ip,
      p_limit: 10,
      p_window_seconds: 60
    })

    if (isLimited) {
      return new NextResponse('Too Many Requests. Please slow down and try again later.', { 
        status: 429,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
  }

  // Refresh session to keep tokens alive
  const { data: { session } } = await supabase.auth.getSession()

  // Handle subdomain routing for per-school whitelabelling
  const hostname = req.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]
  const knownSubdomains = ['unilag', 'ui', 'futa', 'oau', 'unn', 'abu']

  if (knownSubdomains.includes(subdomain)) {
    const url = req.nextUrl.clone()
    url.pathname = `/school/${subdomain}${url.pathname}`
    return NextResponse.rewrite(url)
  }

  // Protected dashboard/admin routes require active session
  const protectedPaths = ['/dashboard', '/campaigns', '/reconciliation', '/admin']
  const isProtectedPath = protectedPaths.some(path =>
    req.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
