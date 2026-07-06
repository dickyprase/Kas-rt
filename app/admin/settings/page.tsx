import db from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SettingsUmum from '@/components/settings/settings-umum';
import SettingsTelegram from '@/components/settings/settings-telegram';
import SettingsCronjob from '@/components/settings/settings-cronjob';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  // Fetch all settings
  const { rows: settingsRows } = await db.query(
    "SELECT key, value FROM settings WHERE key IN ('app_name', 'app_description', 'bot_token', 'chat_id', 'telegram_chat_id')"
  );

  const settingsMap: Record<string, string> = {};
  for (const row of settingsRows) {
    settingsMap[row.key] = row.value;
  }

  const appName = settingsMap['app_name'] || 'Kas RT';
  const appDescription = settingsMap['app_description'] || 'Sistem manajemen kas RT';
  const botToken = settingsMap['bot_token'] || '';
  const chatId = settingsMap['chat_id'] || settingsMap['telegram_chat_id'] || '584847845';

  // Fetch cron settings
  let cronSettings = {
    is_enabled: false,
    frequency: 'daily',
    send_hour: 7,
    send_minute: 0,
    monthly_date: null as number | null,
  };

  try {
    const { rows: cronRows } = await db.query(
      'SELECT is_enabled, frequency, send_hour, send_minute, monthly_date FROM cron_settings ORDER BY id LIMIT 1'
    );
    if (cronRows.length > 0) {
      cronSettings = {
        is_enabled: cronRows[0].is_enabled,
        frequency: cronRows[0].frequency,
        send_hour: cronRows[0].send_hour,
        send_minute: cronRows[0].send_minute,
        monthly_date: cronRows[0].monthly_date,
      };
    }
  } catch {
    // use defaults
  }

  return (
    <Tabs defaultValue="umum" className="w-full">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="umum" className="flex-1 sm:flex-none">
          Umum
        </TabsTrigger>
        <TabsTrigger value="telegram" className="flex-1 sm:flex-none">
          Telegram
        </TabsTrigger>
        <TabsTrigger value="backup" className="flex-1 sm:flex-none">
          Auto Backup
        </TabsTrigger>
      </TabsList>
      <TabsContent value="umum" className="mt-4">
        <SettingsUmum appName={appName} appDescription={appDescription} />
      </TabsContent>
      <TabsContent value="telegram" className="mt-4">
        <SettingsTelegram botToken={botToken} chatId={chatId} />
      </TabsContent>
      <TabsContent value="backup" className="mt-4">
        <SettingsCronjob initialSettings={cronSettings} />
      </TabsContent>
    </Tabs>
  );
}
