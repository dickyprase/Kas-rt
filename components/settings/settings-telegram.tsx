'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2, Eye, EyeOff, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsTelegram({
  botToken,
  chatId,
}: {
  botToken: string;
  chatId: string;
}) {
  const [token, setToken] = useState(botToken);
  const [chat, setChat] = useState(chatId);
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            bot_token: token,
            chat_id: chat,
          },
        }),
      });
      if (res.ok) {
        toast.success('Pengaturan Telegram berhasil disimpan!');
      } else {
        toast.error('Gagal menyimpan pengaturan');
      }
    } catch {
      toast.error('Gagal menyimpan: Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_telegram' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Pesan test berhasil dikirim ke Telegram!');
      } else {
        toast.error(`Gagal: ${data.error || 'Unknown error'}`);
      }
    } catch {
      toast.error('Gagal mengirim: Network error');
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Telegram</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="bot_token" className="text-sm font-medium">
            Bot Token
          </label>
          <div className="relative">
            <Input
              id="bot_token"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Masukkan Telegram Bot Token"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="chat_id" className="text-sm font-medium">
            Chat ID
          </label>
          <Input
            id="chat_id"
            type="text"
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            placeholder="584847845"
          />
          <p className="text-xs text-muted-foreground">
            Chat ID untuk menerima file backup dan notifikasi
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing}
            className="gap-2"
          >
            {testing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {testing ? 'Mengirim...' : 'Test Kirim'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
