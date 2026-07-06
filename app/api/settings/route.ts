import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { rows } = await db.query(
      "SELECT key, value FROM settings WHERE key IN ('app_name', 'app_description', 'bot_token', 'chat_id', 'telegram_chat_id', 'cron_enabled', 'cron_frequency', 'cron_hour', 'cron_minute')"
    );
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return NextResponse.json(settings);
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
    const body = await request.json();

    // Handle settings key-value pairs
    if (body.settings) {
      for (const [key, value] of Object.entries(body.settings)) {
        const dbKey = key === 'chat_id' ? 'chat_id' : key;
        await db.query(
          `INSERT INTO settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = $2`,
          [dbKey, value]
        );
      }
    }

    // Handle cron_settings
    if (body.cron_settings) {
      const cs = body.cron_settings;
      // Also store in settings table for backward compatibility
      await db.query(
        `INSERT INTO settings (key, value) VALUES ('cron_enabled', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [String(cs.is_enabled)]
      );
      await db.query(
        `INSERT INTO settings (key, value) VALUES ('cron_frequency', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [cs.frequency]
      );
      await db.query(
        `INSERT INTO settings (key, value) VALUES ('cron_hour', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [String(cs.send_hour)]
      );
      await db.query(
        `INSERT INTO settings (key, value) VALUES ('cron_minute', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [String(cs.send_minute)]
      );

      // Update cron_settings table
      await db.query(
        `UPDATE cron_settings SET 
          is_enabled = $1, frequency = $2, send_hour = $3, 
          send_minute = $4, monthly_date = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = (SELECT id FROM cron_settings ORDER BY id LIMIT 1)`,
        [cs.is_enabled, cs.frequency, cs.send_hour, cs.send_minute, cs.monthly_date]
      );
    }

    // Handle legacy single-key updates
    if (body.telegram_chat_id) {
      await db.query(
        `INSERT INTO settings (key, value) VALUES ('chat_id', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [body.telegram_chat_id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Settings PUT error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action } = await request.json();

    if (action === 'test_telegram') {
      // Get bot token and chat id
      const { rows } = await db.query(
        "SELECT key, value FROM settings WHERE key IN ('bot_token', 'chat_id', 'telegram_chat_id')"
      );
      const settingsMap: Record<string, string> = {};
      for (const row of rows) {
        settingsMap[row.key] = row.value;
      }

      const botToken = settingsMap['bot_token'];
      const chatId = settingsMap['chat_id'] || settingsMap['telegram_chat_id'];

      if (!botToken) {
        return NextResponse.json(
          { error: 'Bot token belum dikonfigurasi' },
          { status: 400 }
        );
      }
      if (!chatId) {
        return NextResponse.json(
          { error: 'Chat ID belum dikonfigurasi' },
          { status: 400 }
        );
      }

      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ Test pesan dari Kas RT!\n\nKonfigurasi Telegram berhasil.',
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Telegram API error: ${errText}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Settings POST error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
