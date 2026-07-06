import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { initDatabase } from '@/lib/db-init';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDatabase();
    const { rows } = await db.query(
      "SELECT value FROM settings WHERE key = 'telegram_chat_id'"
    );
    const chatId = rows.length > 0 ? rows[0].value : '584847845';
    return NextResponse.json({ telegram_chat_id: chatId });
  } catch (err: unknown) {
    console.error('Settings GET error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDatabase();
    const { telegram_chat_id } = await request.json();
    if (!telegram_chat_id) {
      return NextResponse.json({ error: 'telegram_chat_id is required' }, { status: 400 });
    }
    await db.query(
      `INSERT INTO settings (key, value) VALUES ('telegram_chat_id', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [telegram_chat_id]
    );
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Settings PUT error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
