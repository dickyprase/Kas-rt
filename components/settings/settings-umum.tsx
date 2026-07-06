'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsUmum({
  appName,
  appDescription,
}: {
  appName: string;
  appDescription: string;
}) {
  const [name, setName] = useState(appName);
  const [description, setDescription] = useState(appDescription);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            app_name: name,
            app_description: description,
          },
        }),
      });
      if (res.ok) {
        toast.success('Pengaturan umum berhasil disimpan!');
      } else {
        toast.error('Gagal menyimpan pengaturan');
      }
    } catch {
      toast.error('Gagal menyimpan: Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Umum</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="app_name" className="text-sm font-medium">
            Nama Aplikasi
          </label>
          <Input
            id="app_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kas RT"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="app_description" className="text-sm font-medium">
            Deskripsi Aplikasi
          </label>
          <Textarea
            id="app_description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Sistem manajemen kas RT"
            rows={3}
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </CardContent>
    </Card>
  );
}
