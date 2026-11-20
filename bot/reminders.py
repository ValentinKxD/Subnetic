"""Нагадування про платежі."""

from __future__ import annotations

import asyncio
import html
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import db

log = logging.getLogger("subnetic.reminders")

REMIND_DAYS = (7, 3, 1)

#: Надсилає текст у чат; кидає виняток, якщо Telegram не прийняв повідомлення.
SendFunc = Callable[[int, str], Awaitable[None]]

CURRENCY_SYMBOLS = {"UAH": "₴", "USD": "$", "EUR": "€"}


@dataclass
class RunStats:
    """Підсумок одного запуску (для логів і тестів)."""

    checked: int = 0
    sent: int = 0
    skipped_disabled: int = 0
    skipped_duplicate: int = 0
    failed: int = 0
    messages: list[tuple[int, str]] = field(default_factory=list)


# ── Текст повідомлення ──────────────────────────────────────


def format_amount(price: float, currency: str) -> str:
    """299 ₴, 11,99 $, 1 250 ₴ — як у вебзастосунку."""
    whole = round(price, 2)
    text = f"{whole:,.0f}" if whole == int(whole) else f"{whole:,.2f}"
    text = text.replace(",", " ").replace(".", ",")
    return f"{text} {CURRENCY_SYMBOLS.get(currency, currency)}"


def days_word(n: int) -> str:
    if n % 10 == 1 and n % 100 != 11:
        return "день"
    if n % 10 in (2, 3, 4) and n % 100 not in (12, 13, 14):
        return "дні"
    return "днів"


def when_text(days: int) -> str:
    if days == 0:
        return "сьогодні"
    if days == 1:
        return "завтра"
    return f"через {days} {days_word(days)}"


def build_message(p: db.DuePayment, days: int) -> str:
    title = "🔔 Закінчується пробний період" if p.status == "trial" else "🔔 Нагадування про платіж"
    return (
        f"<b>{title}</b>\n\n"
        f"<b>{html.escape(p.service)}</b> · {html.escape(p.plan)}\n"
        f"Сума: <b>{format_amount(p.price, p.currency)}</b>\n"
        f"Дата списання: {p.due_date.strftime('%d.%m.%Y')} ({when_text(days)})"
    )


# ── Запуск ──────────────────────────────────────────────────


def _enabled(p: db.DuePayment, days: int) -> bool:
    return {7: p.remind_7, 3: p.remind_3, 1: p.remind_1}[days]


async def send_due_reminders(
    db_path: Path | str,
    tz: ZoneInfo,
    send: SendFunc,
    now: datetime | None = None,
) -> RunStats:
    """Надсилає нагадування, час яких настав. Ніколи не кидає через помилки надсилання."""
    now = now.astimezone(tz) if now else datetime.now(tz)
    today = now.date()
    due_dates = {today + timedelta(days=n): n for n in REMIND_DAYS}
    stats = RunStats()

    # sqlite3 синхронний — виконуємо в окремому потоці, щоб не блокувати polling бота.
    candidates = await asyncio.to_thread(db.find_due_payments, db_path, now.hour, list(due_dates))
    for p in candidates:
        stats.checked += 1
        days = due_dates[p.due_date]
        if not _enabled(p, days):
            stats.skipped_disabled += 1
            continue

        reminder_id = await asyncio.to_thread(db.reserve_reminder, db_path, p.subscription_id, p.due_date, days)
        if reminder_id is None:
            stats.skipped_duplicate += 1
            continue

        text = build_message(p, days)
        try:
            await send(p.chat_id, text)
        except Exception as e:  # noqa: BLE001 — будь-яка помилка Telegram не має зупинити бота
            stats.failed += 1
            log.warning(
                "Не вдалося надіслати нагадування (user=%s, subscription=%s, chat=%s): %s: %s",
                p.user_id, p.subscription_id, p.chat_id, type(e).__name__, e,
            )
            await asyncio.to_thread(db.release_reminder, db_path, reminder_id)
            continue

        await asyncio.to_thread(db.mark_reminder_sent, db_path, reminder_id)
        stats.sent += 1
        stats.messages.append((p.chat_id, text))

    log.info(
        "Нагадування %s о %02d:00: перевірено %d, надіслано %d, вимкнено %d, дублікатів %d, помилок %d",
        today.isoformat(), now.hour, stats.checked, stats.sent, stats.skipped_disabled, stats.skipped_duplicate, stats.failed,
    )
    return stats
