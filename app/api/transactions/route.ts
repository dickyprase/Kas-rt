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

  const { type, amount, description, trans_date } = await request.json();

  if (!type || !amount || !description || !trans_date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await db.query('INSERT INTO transactions (type, amount, description, trans_date) VALUES ($1, $2, $3, $4)', [type, amount, description, trans_date]);

  return NextResponse.json({ success: true });
}

// PUT - update transaction
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, type, amount, description, trans_date } = await request.json();

  if (!id || !type || !amount || !description || !trans_date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await db.query('UPDATE transactions SET type=$1, amount=$2, description=$3, trans_date=$4 WHERE id=$5', [type, amount, description, trans_date, id]);

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
