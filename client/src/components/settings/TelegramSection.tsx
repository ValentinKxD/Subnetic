import { useEffect, useRef, useState } from 'react';
import { getSettings, linkTelegram, testTelegram, unlinkTelegram } from '@/api/endpoints';
import { Alert, Badge, Button, SendIcon } from '@/components/ui';
import { useSettings } from '@/hooks/SettingsContext';
import { formatDate } from '@/lib/format';
import type { Settings } from '@/lib/types';
import { ui } from '@/lib/ui';
import { SettingsSection } from './SettingsSection';

type Busy = 'link' | 'unlink' | 'test' | null;
type Notice = { variant: 'success' | 'error' | 'info'; text: string; url?: string } | null;
type TelegramState = Settings['telegram'];

/** Підпис і бейдж для трьох станів: бот не налаштований / не прив'язано / прив'язано. */
function describe(tg: TelegramState) {
  if (!tg.configured) {
    return {
      title: 'Бот не налаштований',
      meta: 'На сервері не задано TELEGRAM_BOT_TOKEN і TELEGRAM_BOT_NAME — див. bot/README.md',
      badge: { variant: 'neutral' as const, text: 'Недоступно' },
    };
  }
  if (!tg.linked) {
    return {
      title: 'Не привʼязано',
      meta: `Бот @${tg.bot_name} надсилатиме нагадування про списання`,
      badge: { variant: 'neutral' as const, text: 'Не підключено' },
    };
  }
  return {
    title: tg.username ? `Привʼязано @${tg.username}` : 'Привʼязано',
    meta: tg.linked_at ? `Підключено ${formatDate(tg.linked_at)} · бот @${tg.bot_name}` : `Бот @${tg.bot_name}`,
    badge: { variant: 'success' as const, text: 'Підключено' },
  };
}

/** Telegram-сповіщення */
export function TelegramSection({ settings }: { settings: Settings }) {
  const { replace } = useSettings();
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [waitingForBot, setWaitingForBot] = useState(false);
  const tg = settings.telegram;
  const view = describe(tg);

  // Актуальні значення для обробника focus без перепідписки.
  const latest = useRef({ linked: tg.linked, waitingForBot });
  latest.current = { linked: tg.linked, waitingForBot };

  useEffect(() => {
    let inFlight = false;
    const ctrl = new AbortController();

    async function refetch() {
      if (inFlight || document.visibilityState !== 'visible') return;
      inFlight = true;
      try {
        const fresh = await getSettings(ctrl.signal);
        const wasLinked = latest.current.linked;
        replace(fresh);
        if (!wasLinked && fresh.telegram.linked) {
          setWaitingForBot(false);
          setNotice({ variant: 'success', text: 'Telegram привʼязано. Нагадування надходитимуть у чат з ботом.' });
        }
      } catch {
        // Тихо: при поверненні на вкладку помилку мережі не показуємо, спробуємо наступного разу.
      } finally {
        inFlight = false;
      }
    }

    window.addEventListener('focus', refetch);
    document.addEventListener('visibilitychange', refetch);
    return () => {
      ctrl.abort();
      window.removeEventListener('focus', refetch);
      document.removeEventListener('visibilitychange', refetch);
    };
  }, [replace]);

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

  function startLinking() {
    // Вкладку відкриваємо одразу в обробнику кліку, інакше браузер заблокує спливне вікно
    const tab = window.open('', '_blank');
    void run('link', async () => {
      try {
        const r = await linkTelegram();
        replace(r.settings);
        setWaitingForBot(true);
        if (tab) {
          tab.opener = null;
          tab.location.href = r.url;
        }
        return {
          variant: 'info',
          text: tab
            ? 'У новій вкладці відкрито бота — натисніть «Start». Посилання одноразове й діє 15 хвилин. Коли повернетеся сюди, стан оновиться.'
            : 'Браузер заблокував нову вкладку. Відкрийте бота за посиланням і натисніть «Start» (діє 15 хвилин).',
          url: r.url,
        };
      } catch (e) {
        tab?.close();
        throw e;
      }
    });
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
          <span className={ui.list.title}>{view.title}</span>
          <span className={ui.list.meta}>{view.meta}</span>
        </div>
        <Badge variant={view.badge.variant} dot>
          {view.badge.text}
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

      {tg.configured && (
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
                    setWaitingForBot(false);
                    return { variant: 'info', text: 'Telegram відвʼязано. Нагадування більше не надходитимуть.' };
                  })
                }
              >
                Відвʼязати
              </button>
            </>
          ) : (
            <Button loading={busy === 'link'} disabled={busy !== null} onClick={startLinking}>
              <SendIcon />
              {waitingForBot ? 'Нове посилання' : 'Привʼязати'}
            </Button>
          )}
        </div>
      )}
    </SettingsSection>
  );
}
