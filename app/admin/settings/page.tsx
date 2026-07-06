import db from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SettingsUmum from '@/components/settings/settings-umum';
import SettingsTelegram from '@/components/settings/settings-telegram';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
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

  return (
    <Tabs defaultValue="umum" className="w-full">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="umum" className="flex-1 sm:flex-none">
          Umum
        </TabsTrigger>
        <TabsTrigger value="telegram" className="flex-1 sm:flex-none">
          Telegram
        </TabsTrigger>
      </TabsList>
      <TabsContent value="umum" className="mt-4">
        <SettingsUmum appName={appName} appDescription={appDescription} />
      </TabsContent>
      <TabsContent value="telegram" className="mt-4">
        <SettingsTelegram botToken={botToken} chatId={chatId} />
      </TabsContent>
    </Tabs>
  );
}
