import { useState } from 'react';
import { linkTelegram, testTelegram, unlinkTelegram } from '@/api/endpoints';
import { Alert, Badge, Button, SendIcon } from '@/components/ui';
import { useSettings } from '@/hooks/SettingsContext';
import { formatDate } from '@/lib/format';
import type { Settings } from '@/lib/types';
import { ui } from '@/lib/ui';
import { SettingsSection } from './SettingsSection';

type Busy = 'link' | 'unlink' | 'test' | null;
type Notice = { variant: 'success' | 'error' | 'info'; text: string; url?: string } | null;

/** Прив'язка Telegram (заглушка): стан, «Прив'язати», «Відв'язати», «Надіслати тест». */
export function TelegramSection({ settings }: { settings: Settings }) {
  const { replace } = useSettings();
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const tg = settings.telegram;

  async function run(kind: Exclude<Busy, null>, fn: () => Promise<Notice>) {
    setBusy(kind);
    setNotice(null);
    try {
      setNotice(await fn());
    } catch (e) {
      setNotice({ variant: 'error', text: e instanceof Error ? e.message : 'Щось пішло не так' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <SettingsSection
      icon={<SendIcon size={20} />}
      title="Telegram-сповіщення"
      subtitle="Нагадування про платежі приходитимуть у чат з ботом"
    >
      <div className={ui.inset.row}>
        <span className={ui.profileChip.avatar} aria-hidden="true">
          <SendIcon />
        </span>
        <div className={ui.list.main}>
          <span className={ui.list.title}>{tg.linked ? tg.username : 'Не прив’язано'}</span>
          <span className={ui.list.meta}>
            {tg.linked && tg.linked_at ? `Підключено ${formatDate(tg.linked_at)}` : 'Бот надсилатиме нагадування про списання'}
          </span>
        </div>
        <Badge variant={tg.linked ? 'success' : 'neutral'} dot>
          {tg.linked ? 'Підключено' : 'Не підключено'}
        </Badge>
      </div>

      {notice && (
        <Alert variant={notice.variant}>
          {notice.text}
          {notice.url && (
            <>
              {' '}
              <a href={notice.url} target="_blank" rel="noreferrer" className={ui.link.default}>
                Відкрити бота
              </a>
            </>
          )}
        </Alert>
      )}

      <div className={ui.chip.group}>
        {tg.linked ? (
          <>
            <Button
              variant="secondary"
              loading={busy === 'test'}
              disabled={busy !== null}
              onClick={() =>
                run('test', async () => {
                  const r = await testTelegram();
                  return { variant: 'success', text: r.message };
                })
              }
            >
              <SendIcon />
              Надіслати тест
            </Button>
            <button
              type="button"
              className={ui.btnInline.danger}
              disabled={busy !== null}
              onClick={() =>
                run('unlink', async () => {
                  const r = await unlinkTelegram();
                  replace(r.settings);
                  return { variant: 'info', text: 'Telegram відв’язано. Нагадування більше не надходитимуть.' };
                })
              }
            >
              Відв’язати
            </button>
          </>
        ) : (
          <Button
            loading={busy === 'link'}
            disabled={busy !== null}
            onClick={() =>
              run('link', async () => {
                const r = await linkTelegram();
                replace(r.settings);
                return {
                  variant: 'success',
                  text: 'Демо: акаунт одразу позначено прив’язаним. У реальному застосунку прив’язка завершується в боті за посиланням.',
                  url: r.url,
                };
              })
            }
          >
            <SendIcon />
            Прив’язати Telegram
          </Button>
        )}
      </div>
    </SettingsSection>
  );
}
