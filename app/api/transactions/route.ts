import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

// POST - create transaction
export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, kas_type, amount, description, trans_date } = await request.json();

  if (!type || !amount || !description || !trans_date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const kasType = kas_type || 'biasa';

  await db.query(
    'INSERT INTO transactions (type, kas_type, amount, description, trans_date) VALUES ($1, $2, $3, $4, $5)',
    [type, kasType, amount, description, trans_date]
  );

  return NextResponse.json({ success: true });
}

// PUT - update transaction
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, type, kas_type, amount, description, trans_date } = await request.json();

  if (!id || !type || !amount || !description || !trans_date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const kasType = kas_type || 'biasa';

  await db.query(
    'UPDATE transactions SET type=$1, kas_type=$2, amount=$3, description=$4, trans_date=$5 WHERE id=$6',
    [type, kasType, amount, description, trans_date, id]
  );

  return NextResponse.json({ success: true });
}

// DELETE - delete transaction
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  await db.query('DELETE FROM transactions WHERE id=$1', [parseInt(id)]);

  return NextResponse.json({ success: true });
}
