"""Команди бота: /start (з токеном прив'язки або без), /help."""

from __future__ import annotations

import asyncio
import html
import logging
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from aiogram import F, Router
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import Message

import db
from reminders import format_amount, when_text

log = logging.getLogger("subnetic.handlers")
router = Router(name="subnetic")

# Токен сервер генерує як base64url (randomBytes(24)) — 32 символи [A-Za-z0-9_-].
TOKEN_RE = re.compile(r"^[A-Za-z0-9_-]{16,64}$")

HELP_INTRO = (
    "<b>Subnetic — нагадування про платежі</b>\n\n"
    "Я надсилаю нагадування про списання за ваші підписки: за 7, 3 і 1 день до платежу "
    "(які саме й о котрій годині — обирається в Налаштуваннях Subnetic)."
)

HELP_HOW_TO_LINK = (
    "<b>Як підключити:</b>\n"
    "1. Відкрийте Subnetic → Налаштування → «Telegram-сповіщення».\n"
    "2. Натисніть «Привʼязати» — відкриється цей чат.\n"
    "3. Натисніть «Start». Посилання одноразове й діє 15 хвилин."
)

HELP_COMMANDS = (
    "<b>Команди:</b>\n"
    "/start — стан підключення\n"
    "/account — ваш акаунт і список підписок\n"
    "/help — ця довідка\n\n"
    "Відвʼязати Telegram або змінити нагадування можна в Налаштуваннях Subnetic."
)


def _reminder_days(acc: db.ChatAccount | db.AccountOverview) -> str:
    days = [
        label
        for on, label in ((acc.remind_7, "за 7 днів"), (acc.remind_3, "за 3 дні"), (acc.remind_1, "за 1 день"))
        if on
    ]
    return f"{', '.join(days)}, о {acc.remind_hour:02d}:00" if days else "вимкнено"


def build_help(acc: db.ChatAccount | None, now: datetime) -> str:
    """Довідка; для прив'язаного чату — ще акаунт, нагадування й найближчий платіж."""
    if acc is None:
        return f"{HELP_INTRO}\n\n{HELP_HOW_TO_LINK}\n\n{HELP_COMMANDS}"

    lines = [
        "<b>Ваш акаунт</b>",
        f"Акаунт: <b>{html.escape(acc.nickname)}</b>",
        f"Активних підписок: {acc.active_count}",
        f"Нагадування: {_reminder_days(acc)}",
    ]
    p = acc.next_payment
    if p is None:
        lines.append("Найближчих платежів немає")
    else:
        days = (p.due_date - now.date()).days
        lines.append(
            f"Найближчий платіж: {html.escape(p.service)} · {html.escape(p.plan)} — "
            f"<b>{format_amount(p.price, p.currency)}</b>, {p.due_date.strftime('%d.%m.%Y')} ({when_text(days)})"
        )
    return f"{HELP_INTRO}\n\n" + "\n".join(lines) + f"\n\n{HELP_COMMANDS}"

START_TEXT = (
    "Привіт! Це бот <b>Subnetic</b> для нагадувань про платежі за підписки.\n\n"
    "Щоб підключити акаунт, відкрийте Subnetic → Налаштування → «Привʼязати Telegram» "
    "і перейдіть за посиланням. Докладніше — /help."
)


@router.message(CommandStart(deep_link=True))
async def start_with_token(message: Message, command: CommandObject, db_path: Path) -> None:
    token = (command.args or "").strip()
    user = message.from_user
    if not TOKEN_RE.fullmatch(token) or user is None:
        await message.answer("Посилання недійсне або застаріле. Згенеруйте нове в Налаштуваннях Subnetic.")
        return

    nickname = await asyncio.to_thread(db.link_account, db_path, token, message.chat.id, user.username)
    if nickname is None:
        await message.answer("Посилання недійсне або застаріле. Згенеруйте нове в Налаштуваннях Subnetic.")
        return

    log.info("Чат %s прив'язано до акаунта %s", message.chat.id, nickname)
    await message.answer(
        f"✅ Акаунт привʼязано: <b>{html.escape(nickname)}</b>.\n\n"
        "Тепер я надсилатиму нагадування про платежі. Поверніться у вкладку Subnetic — стан оновиться."
    )


@router.message(CommandStart())
async def start_plain(message: Message, db_path: Path) -> None:
    nickname = await asyncio.to_thread(db.find_nickname_by_chat, db_path, message.chat.id)
    if nickname:
        await message.answer(
            f"Цей чат уже привʼязано до акаунта <b>{html.escape(nickname)}</b> — нагадування надходитимуть сюди.\n\n"
            "/account — акаунт і підписки, /help — довідка."
        )
    else:
        await message.answer(START_TEXT)


@router.message(Command("help"))
async def help_command(message: Message, db_path: Path, tz: ZoneInfo) -> None:
    now = datetime.now(tz)
    acc = await asyncio.to_thread(db.get_chat_account, db_path, message.chat.id, now.date())
    await message.answer(build_help(acc, now))


ACCOUNT_LIMIT = 30  # Telegram обмежує повідомлення 4096 символами

PERIOD_SHORT = {"week": "тиж.", "month": "міс.", "quarter": "кв.", "year": "рік"}
STATUS_TEXT = {"paused": "на паузі", "cancelled": "скасована", "expired": "завершилась"}
STATUS_ICON = {"active": "🟢", "trial": "🎁", "paused": "⏸", "cancelled": "✖️", "expired": "⌛"}
MONTHLY_FACTOR = {"week": 52 / 12, "month": 1.0, "quarter": 1 / 3, "year": 1 / 12}


def _subscription_line(s: db.SubscriptionRow) -> str:
    price = f"{format_amount(s.price, s.currency)}/{PERIOD_SHORT.get(s.billing_period, s.billing_period)}"
    head = f"{STATUS_ICON.get(s.status, '•')} <b>{html.escape(s.service)}</b> · {html.escape(s.plan)} — {price}"
    if s.status == "trial" and s.trial_end_date:
        tail = f"пробна до {s.trial_end_date.strftime('%d.%m.%Y')}"
    elif s.status in STATUS_TEXT:
        tail = STATUS_TEXT[s.status]
    elif s.next_payment_date:
        tail = f"наступний платіж {s.next_payment_date.strftime('%d.%m.%Y')}"
    else:
        tail = "без дати платежу"
    return f"{head}\n      {tail}"


def build_account(acc: db.AccountOverview | None, tz: ZoneInfo) -> str:
    """Відповідь на /account: дані акаунта, налаштування й список підписок."""
    if acc is None:
        return f"Цей чат ще не привʼязано до акаунта Subnetic.\n\n{HELP_HOW_TO_LINK}"

    lines = [
        "<b>👤 Ваш акаунт</b>",
        f"Нікнейм: <b>{html.escape(acc.nickname)}</b>",
        f"Email: {html.escape(acc.email)}",
    ]
    if acc.telegram_linked_at:
        lines.append(f"Telegram привʼязано: {acc.telegram_linked_at.astimezone(tz).strftime('%d.%m.%Y')}")
    lines += [f"Валюта: {acc.currency}", f"Нагадування: {_reminder_days(acc)}", ""]

    subs = acc.subscriptions
    if not subs:
        lines.append("<b>📋 Підписок поки немає</b>\nДодайте їх на сайті Subnetic.")
        return "\n".join(lines)

    active = sum(1 for s in subs if s.status in ("active", "trial"))
    lines.append(f"<b>📋 Підписки ({len(subs)}, активних {active})</b>")
    lines += [_subscription_line(s) for s in subs[:ACCOUNT_LIMIT]]
    if len(subs) > ACCOUNT_LIMIT:
        lines.append(f"… і ще {len(subs) - ACCOUNT_LIMIT} — повний список на сайті")

    # Як на дашборді: активні й пробні з автопродовженням, нормалізовані до місяця, у валюті користувача.
    target = acc.rates.get(acc.currency, 1.0)
    monthly = sum(
        s.price * MONTHLY_FACTOR.get(s.billing_period, 1.0) * acc.rates.get(s.currency, 1.0) / target
        for s in subs
        if s.status == "active" or (s.status == "trial" and s.auto_renew)
    )
    lines += ["", f"Разом на місяць: <b>≈ {format_amount(monthly, acc.currency)}</b>"]
    return "\n".join(lines)


@router.message(Command("account"))
async def account_command(message: Message, db_path: Path, tz: ZoneInfo) -> None:
    acc = await asyncio.to_thread(db.get_account_overview, db_path, message.chat.id)
    await message.answer(build_account(acc, tz))


@router.message(F.text)
async def fallback(message: Message) -> None:
    await message.answer("Я розумію лише команди /start, /account і /help.")
