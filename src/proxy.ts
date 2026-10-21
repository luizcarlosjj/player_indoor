import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const logado = !!req.auth
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !logado) {
    const url = new URL('/admin/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname === '/admin/login' && logado) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }
})

export const config = {
  matcher: ['/admin/:path*'],
}
