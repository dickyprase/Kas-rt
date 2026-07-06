import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

let cachedToken: { token: string; expires: number } | null = null;
let spreadsheetId: string = '';

function getCredentials() {
  // Try env var first (for Vercel/serverless)
  if (process.env.GOOGLE_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS);
  }
  // Fallback to file (for local dev)
  const credPath = path.join(process.cwd(), 'credentials.json');
  if (!fs.existsSync(credPath)) return null;
  return JSON.parse(fs.readFileSync(credPath, 'utf-8'));
}

export function getSpreadsheetId() {
  return spreadsheetId || process.env.GOOGLE_SHEET_ID || '';
}

export function setSpreadsheetId(id: string) {
  spreadsheetId = id;
}

function base64url(data: Buffer | string): string {
  return (typeof data === 'string' ? Buffer.from(data) : data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now()) {
    return cachedToken.token;
  }

  const creds = getCredentials();
  if (!creds) throw new Error('No credentials.json found');

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = base64url(sign.sign(creds.private_key));

  const jwt = `${header}.${payload}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get access token');

  cachedToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

async function api(range: string, method: string, body?: any) {
  const token = await getAccessToken();
  const sid = getSpreadsheetId();
  if (!sid) throw new Error('No GOOGLE_SHEET_ID');

  const base = `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${range}`;
  const url = method === 'GET' ? base : `${base}:append?valueInputOption=RAW`;

  const res = await fetch(url, {
    method: method === 'GET' ? 'GET' : 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new Error(`Sheets ${res.status}: ${await res.text()}`);
  return res.json();
}

async function apiPut(range: string, body: any) {
  const token = await getAccessToken();
  const sid = getSpreadsheetId();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${range}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Sheets PUT ${res.status}: ${await res.text()}`);
  return res.json();
}

async function apiClear(range: string) {
  const token = await getAccessToken();
  const sid = getSpreadsheetId();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${range}:clear`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Sheets CLEAR ${res.status}`);
}

export async function initSheet() {
  if (!getSpreadsheetId()) { console.log('No GOOGLE_SHEET_ID, skip'); return; }
  try {
    const data = await api('Kas!A1:G1', 'GET');
    if (!data.values?.length) {
      await apiPut('Kas!A1:G1', { values: [['ID', 'Tanggal', 'Tipe', 'Kas Type', 'Jumlah', 'Keterangan', 'Created At']] });
    }
  } catch (e: any) { console.error('Sheet init:', e.message); }
}

export async function appendTransaction(tx: { id: number; trans_date: string; type: string; kas_type: string; amount: number; description: string; created_at: string; }) {
  if (!getSpreadsheetId()) return;
  try {
    await api('Kas!A:G', 'POST', { values: [[tx.id, tx.trans_date, tx.type, tx.kas_type, tx.amount, tx.description, tx.created_at]] });
  } catch (e: any) { console.error('Sheet append:', e.message); }
}

export async function updateTransactionRow(id: number, tx: { trans_date: string; type: string; kas_type: string; amount: number; description: string; }) {
  if (!getSpreadsheetId()) return;
  try {
    const data = await api('Kas!A:A', 'GET');
    const rows = data.values || [];
    const idx = rows.findIndex((r: any[], i: number) => i > 0 && parseInt(r[0]) === id);
    if (idx === -1) { await appendTransaction({ id, ...tx, created_at: new Date().toISOString() }); return; }
    await apiPut(`Kas!A${idx + 1}:G${idx + 1}`, { values: [[id, tx.trans_date, tx.type, tx.kas_type, tx.amount, tx.description, rows[idx][6] || '']] });
  } catch (e: any) { console.error('Sheet update:', e.message); }
}

export async function deleteTransactionRow(id: number) {
  if (!getSpreadsheetId()) return;
  try {
    const data = await api('Kas!A:A', 'GET');
    const rows = data.values || [];
    const idx = rows.findIndex((r: any[], i: number) => i > 0 && parseInt(r[0]) === id);
    if (idx >= 0) await apiClear(`Kas!A${idx + 1}:G${idx + 1}`);
  } catch (e: any) { console.error('Sheet delete:', e.message); }
}
