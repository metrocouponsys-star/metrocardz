import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, DEALS_ADMIN_COOKIE } from '@/lib/dealsAuth';

/**
 * Next.js Middleware — Deals Admin Route Protection
 *
 * Protects:
 *   - /admin/deals   (all sub-paths)
 *   - /admin/brands  (all sub-paths)
 *   - /api/admin/*   (all admin API routes)
 *
 * Does NOT protect:
 *   - /admin/login   (public auth page)
 *   - All other routes (merchant portal, landing page, public deals)
 *
 * On unauthenticated access:
 *   - HTML routes → redirect to /admin/login
 *   - API routes  → 401 JSON response
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedAdminPage = (
    pathname.startsWith('/admin/deals') ||
    pathname.startsWith('/admin/brands')
  ) && !pathname.startsWith('/admin/login');

  const isProtectedAdminApi = pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/auth');

  if (!isProtectedAdminPage && !isProtectedAdminApi) {
    return NextResponse.next(); // Not a protected route — pass through
  }

  const token = request.cookies.get(DEALS_ADMIN_COOKIE)?.value;
  const payload = token ? await verifyAdminToken(token) : null;

  if (!payload) {
    if (isProtectedAdminApi) {
      return NextResponse.json({ error: true, message: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token valid — add admin email to headers for request context if needed
  const response = NextResponse.next();
  response.headers.set('x-admin-email', payload.email);
  return response;
}

export const config = {
  matcher: [
    '/admin/deals/:path*',
    '/admin/brands/:path*',
    '/api/admin/:path*',
  ],
};
