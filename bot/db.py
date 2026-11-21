"""Робота з SQLite сервера Subnetic (sqlite3 зі стандартної бібліотеки)."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path


def connect(db_path: Path | str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 5000")
    return conn


@contextmanager
def connection(db_path: Path | str) -> Iterator[sqlite3.Connection]:
    """Підключення на одну операцію: commit при успіху, rollback при помилці, завжди close."""
    conn = connect(db_path)
    try:
        with conn:  # транзакція
            yield conn
    finally:
        conn.close()


# ── Прив'язка акаунта ───────────────────────────────────────


def link_account(db_path: Path | str, token: str, chat_id: int, username: str | None) -> str | None:
    """Завершує прив'язку за одноразовим токеном із /start <токен>."""
    with connection(db_path) as conn:
        conn.execute("DELETE FROM telegram_link_tokens WHERE expires_at <= datetime('now')")
        row = conn.execute(
            """SELECT t.user_id, u.nickname
               FROM telegram_link_tokens t JOIN users u ON u.id = t.user_id
               WHERE t.token = ? AND t.expires_at > datetime('now')""",
            (token,),
        ).fetchone()
        if row is None:
            return None

        conn.execute(
            """UPDATE users SET telegram_chat_id = NULL, telegram_username = NULL, telegram_linked_at = NULL
               WHERE telegram_chat_id = ? AND id <> ?""",
            (chat_id, row["user_id"]),
        )
        conn.execute(
            """UPDATE users
               SET telegram_chat_id = ?, telegram_username = ?, telegram_linked_at = datetime('now')
               WHERE id = ?""",
            (chat_id, username, row["user_id"]),
        )
        conn.execute("DELETE FROM telegram_link_tokens WHERE token = ?", (token,))
        return str(row["nickname"])


def find_nickname_by_chat(db_path: Path | str, chat_id: int) -> str | None:
    with connection(db_path) as conn:
        row = conn.execute("SELECT nickname FROM users WHERE telegram_chat_id = ?", (chat_id,)).fetchone()
        return None if row is None else str(row["nickname"])


# ── Акаунт (/account) ───────────────────────────────────────

#: Резервні курси до гривні, якщо в exchange_rates порожньо (як на сервері).
DEFAULT_RATES = {"UAH": 1.0, "USD": 41.5, "EUR": 45.2}


@dataclass(frozen=True)
class SubscriptionRow:
    service: str
    plan: str
    price: float
    currency: str
    billing_period: str
    status: str
    auto_renew: bool
    next_payment_date: date | None
    trial_end_date: date | None


@dataclass(frozen=True)
class AccountOverview:
    """Відомості про прив'язаний акаунт і його підписки для /account."""

    nickname: str
    email: str
    telegram_linked_at: datetime | None
    currency: str
    remind_7: bool
    remind_3: bool
    remind_1: bool
    remind_hour: int
    subscriptions: list[SubscriptionRow]
    rates: dict[str, float]


def _to_date(value: str | None) -> date | None:
    return date.fromisoformat(value) if value else None


def get_account_overview(db_path: Path | str, chat_id: int) -> AccountOverview | None:
    with connection(db_path) as conn:
        user = conn.execute(
            """SELECT u.id, u.nickname, u.email, u.telegram_linked_at,
                      st.currency, st.remind_7, st.remind_3, st.remind_1, st.remind_hour
               FROM users u JOIN user_settings st ON st.user_id = u.id
               WHERE u.telegram_chat_id = ?""",
            (chat_id,),
        ).fetchone()
        if user is None:
            return None
        subs = conn.execute(
            """SELECT sv.name AS service, p.name AS plan, p.price, p.currency, p.billing_period,
                      s.status, s.auto_renew, s.next_payment_date, s.trial_end_date
               FROM subscriptions s
               JOIN plans p     ON p.id = s.plan_id
               JOIN services sv ON sv.id = p.service_id
               WHERE s.user_id = ?
               ORDER BY CASE s.status WHEN 'active' THEN 0 WHEN 'trial' THEN 0 WHEN 'paused' THEN 1
                                      WHEN 'cancelled' THEN 2 ELSE 3 END,
                        s.next_payment_date IS NULL, s.next_payment_date, sv.name""",
            (user["id"],),
        ).fetchall()
        rates = dict(DEFAULT_RATES)
        for r in conn.execute("SELECT currency, rate_to_uah FROM v_current_rates").fetchall():
            rates[r["currency"]] = float(r["rate_to_uah"])

    linked_at = user["telegram_linked_at"]
    return AccountOverview(
        nickname=str(user["nickname"]),
        email=str(user["email"]),
        telegram_linked_at=datetime.fromisoformat(linked_at).replace(tzinfo=timezone.utc) if linked_at else None,
        currency=str(user["currency"]),
        remind_7=bool(user["remind_7"]),
        remind_3=bool(user["remind_3"]),
        remind_1=bool(user["remind_1"]),
        remind_hour=int(user["remind_hour"]),
        subscriptions=[
            SubscriptionRow(
                service=r["service"],
                plan=r["plan"],
                price=float(r["price"]),
                currency=r["currency"],
                billing_period=r["billing_period"],
                status=r["status"],
                auto_renew=bool(r["auto_renew"]),
                next_payment_date=_to_date(r["next_payment_date"]),
                trial_end_date=_to_date(r["trial_end_date"]),
            )
            for r in subs
        ],
        rates=rates,
    )


# ── Нагадування ─────────────────────────────────────────────


@dataclass(frozen=True)
class NextPayment:
    service: str
    plan: str
    price: float
    currency: str
    due_date: date


@dataclass(frozen=True)
class ChatAccount:
    """Акаунт, прив'язаний до чату, для персональної /help."""

    nickname: str
    remind_7: bool
    remind_3: bool
    remind_1: bool
    remind_hour: int
    active_count: int
    next_payment: NextPayment | None


def get_chat_account(db_path: Path | str, chat_id: int, today: date) -> ChatAccount | None:
    with connection(db_path) as conn:
        user = conn.execute(
            """SELECT u.id, u.nickname, st.remind_7, st.remind_3, st.remind_1, st.remind_hour
               FROM users u JOIN user_settings st ON st.user_id = u.id
               WHERE u.telegram_chat_id = ?""",
            (chat_id,),
        ).fetchone()
        if user is None:
            return None
        count = conn.execute(
            "SELECT count(*) FROM subscriptions WHERE user_id = ? AND status IN ('active', 'trial')",
            (user["id"],),
        ).fetchone()[0]
        nxt = conn.execute(
            """SELECT sv.name AS service, p.name AS plan, p.price, p.currency, s.next_payment_date
               FROM subscriptions s
               JOIN plans p     ON p.id = s.plan_id
               JOIN services sv ON sv.id = p.service_id
               WHERE s.user_id = ? AND s.status IN ('active', 'trial') AND s.next_payment_date >= ?
               ORDER BY s.next_payment_date, sv.name
               LIMIT 1""",
            (user["id"], today.isoformat()),
        ).fetchone()
    return ChatAccount(
        nickname=str(user["nickname"]),
        remind_7=bool(user["remind_7"]),
        remind_3=bool(user["remind_3"]),
        remind_1=bool(user["remind_1"]),
        remind_hour=int(user["remind_hour"]),
        active_count=int(count),
        next_payment=None
        if nxt is None
        else NextPayment(
            service=nxt["service"],
            plan=nxt["plan"],
            price=float(nxt["price"]),
            currency=nxt["currency"],
            due_date=date.fromisoformat(nxt["next_payment_date"]),
        ),
    )


@dataclass(frozen=True)
class DuePayment:
    """Підписка користувача з прив'язаним Telegram, платіж якої припадає на одну з дат нагадувань."""

    user_id: int
    chat_id: int
    subscription_id: int
    status: str
    due_date: date
    service: str
    plan: str
    price: float
    currency: str
    remind_7: bool
    remind_3: bool
    remind_1: bool


def find_due_payments(db_path: Path | str, hour: int, due_dates: list[date]) -> list[DuePayment]:
    """Підписки active/trial з платежем у задані дати в користувачів із поточною remind_hour."""
    if not due_dates:
        return []
    placeholders = ", ".join("?" for _ in due_dates)
    with connection(db_path) as conn:
        rows = conn.execute(
            f"""SELECT u.id AS user_id, u.telegram_chat_id AS chat_id,
                       s.id AS subscription_id, s.status, s.next_payment_date,
                       sv.name AS service, p.name AS plan, p.price, p.currency,
                       st.remind_7, st.remind_3, st.remind_1
                FROM users u
                JOIN user_settings st ON st.user_id = u.id
                JOIN subscriptions s  ON s.user_id = u.id
                JOIN plans p          ON p.id = s.plan_id
                JOIN services sv      ON sv.id = p.service_id
                WHERE u.telegram_chat_id IS NOT NULL
                  AND u.blocked_at IS NULL
                  AND st.remind_hour = ?
                  AND s.status IN ('active', 'trial')
                  AND s.next_payment_date IN ({placeholders})
                ORDER BY u.id, s.next_payment_date, sv.name""",
            (hour, *(d.isoformat() for d in due_dates)),
        ).fetchall()
    return [
        DuePayment(
            user_id=r["user_id"],
            chat_id=r["chat_id"],
            subscription_id=r["subscription_id"],
            status=r["status"],
            due_date=date.fromisoformat(r["next_payment_date"]),
            service=r["service"],
            plan=r["plan"],
            price=float(r["price"]),
            currency=r["currency"],
            remind_7=bool(r["remind_7"]),
            remind_3=bool(r["remind_3"]),
            remind_1=bool(r["remind_1"]),
        )
        for r in rows
    ]


def reserve_reminder(db_path: Path | str, subscription_id: int, due_date: date, days_before: int) -> int | None:
    """Пробує вставити запис у reminders."""
    with connection(db_path) as conn:
        cur = conn.execute(
            """INSERT INTO reminders (subscription_id, due_date, days_before) VALUES (?, ?, ?)
               ON CONFLICT (subscription_id, due_date, days_before) DO NOTHING""",
            (subscription_id, due_date.isoformat(), days_before),
        )
        return cur.lastrowid if cur.rowcount == 1 else None


def mark_reminder_sent(db_path: Path | str, reminder_id: int) -> None:
    with connection(db_path) as conn:
        conn.execute("UPDATE reminders SET sent_at = datetime('now') WHERE id = ?", (reminder_id,))


def release_reminder(db_path: Path | str, reminder_id: int) -> None:
    """Повідомлення не надіслано — знімаємо резерв, щоб наступний запуск міг спробувати знову."""
    with connection(db_path) as conn:
        conn.execute("DELETE FROM reminders WHERE id = ? AND sent_at IS NULL", (reminder_id,))
