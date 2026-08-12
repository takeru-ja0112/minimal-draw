import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    try {
      const authValue = basicAuth.split(' ')[1];
      const decoded = atob(authValue);
      const [user, password] = decoded.split(':');

      const adminUser = process.env.ADMIN_BASIC_AUTH_USER;
      const adminPassword = process.env.ADMIN_BASIC_AUTH_PASSWORD;

      console.log('Basic Auth check:', {
        hasUserHeader: !!user,
        hasPassHeader: !!password,
        expectedUserExists: !!adminUser,
        expectedPassExists: !!adminPassword,
        userMatches: user === adminUser,
        passMatches: password === adminPassword,
      });

      if (adminUser && adminPassword && user === adminUser && password === adminPassword) {
        return NextResponse.next();
      }
    } catch (e) {
      console.error('Basic Auth decode error:', e);
    }
  }

  return new NextResponse('Auth Required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Panel"',
    },
  });
}

export const config = {
  matcher: ['/admin/:path*'],
};
