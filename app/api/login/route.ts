import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const admin = (await db.query('SELECT * FROM admins WHERE username = $1', [username])).rows[0] as any;
  if (!admin) {
    return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
  }

  const valid = bcrypt.compareSync(password, admin.password);
  if (!valid) {
    return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
  }

  const session = await getSession();
  session.userId = admin.id;
  session.username = admin.username;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ success: true });
}
