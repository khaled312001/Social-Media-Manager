import { NextRequest, NextResponse } from 'next/server';

// Admin credentials for local demo
// Change these to your preferred credentials
const ADMIN_CREDENTIALS = [
  { email: 'admin@barmagly.com', password: 'Admin@123456', name: 'Admin' },
  { email: 'demo@barmagly.com',  password: 'Demo@123456',  name: 'Demo User' },
];

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const user = ADMIN_CREDENTIALS.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
  }

  const token = Buffer.from(JSON.stringify({ email: user.email, name: user.name, ts: Date.now() })).toString('base64');

  const res = NextResponse.json({ user: { email: user.email, name: user.name }, token });
  res.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
