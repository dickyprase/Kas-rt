'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Loader2, Info, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface CronSettings {
  is_enabled: boolean;
  frequency: string;
  send_hour: number;
  send_minute: number;
  monthly_date: number | null;
}

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = [0, 15, 30, 45];
const dates = Array.from({ length: 31 }, (_, i) => i + 1);

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function getPreview(settings: CronSettings): string {
  const time = `${pad(settings.send_hour)}:${pad(settings.send_minute)} WIB`;
  if (settings.frequency === 'daily') {
    return `Setiap hari pukul ${time}`;
  }
  const dateStr = settings.monthly_date || 1;
  return `Setiap tanggal ${dateStr} pukul ${time}`;
}

export default function SettingsCronjob({
  initialSettings,
}: {
  initialSettings: CronSettings;
}) {
  const [settings, setSettings] = useState<CronSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cron_settings: settings,
        }),
      });
      if (res.ok) {
        toast.success('Pengaturan auto backup berhasil disimpan!');
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
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4" />
          Auto Backup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Aktifkan Auto Backup</label>
            <p className="text-xs text-muted-foreground">
              Kirim backup Excel ke Telegram secara otomatis
            </p>
          </div>
          <Switch
            checked={settings.is_enabled}
            onCheckedChange={(checked: boolean) =>
              setSettings({ ...settings, is_enabled: checked })
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Frekuensi</label>
            <Select
              value={settings.frequency}
              onValueChange={(value: string | null) => {
                if (value) setSettings({ ...settings, frequency: value });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Harian</SelectItem>
                <SelectItem value="monthly">Bulanan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.frequency === 'monthly' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal</label>
              <Select
                value={String(settings.monthly_date || 1)}
                onValueChange={(value: string | null) => {
                  if (value) setSettings({ ...settings, monthly_date: Number(value) });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dates.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      Tanggal {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Jam</label>
            <Select
              value={String(settings.send_hour)}
              onValueChange={(value: string | null) => {
                if (value) setSettings({ ...settings, send_hour: Number(value) });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hours.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {pad(h)}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Menit</label>
            <Select
              value={String(settings.send_minute)}
              onValueChange={(value: string | null) => {
                if (value) setSettings({ ...settings, send_minute: Number(value) });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    :{pad(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <Clock className="size-4" />
            {getPreview(settings)}
          </p>
        </div>

        <Alert>
          <Info className="size-4" />
          <AlertDescription className="text-xs">
            Auto backup akan mengirim file Excel berisi semua data transaksi ke
            Telegram sesuai jadwal yang ditentukan. Pastikan Bot Token dan Chat
            ID Telegram sudah dikonfigurasi dengan benar.
          </AlertDescription>
        </Alert>

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
