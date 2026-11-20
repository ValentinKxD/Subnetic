"""Налаштування бота з bot/.env (python-dotenv)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from dotenv import load_dotenv

BOT_DIR = Path(__file__).resolve().parent

# Змінні з bot/.env; уже задані в середовищі мають пріоритет.
load_dotenv(BOT_DIR / ".env")

DEFAULT_DB_PATH = "../server/data/subnetic.db"
DEFAULT_TZ = "Europe/Kyiv"


class ConfigError(Exception):
    """Помилка конфігурації з повідомленням для людини."""


@dataclass(frozen=True)
class Config:
    token: str
    db_path: Path
    tz: ZoneInfo


def resolve_db_path(raw: str | None) -> Path:
    """Відносний шлях рахуємо від папки bot/, а не від поточної директорії."""
    path = Path(raw or DEFAULT_DB_PATH)
    return path if path.is_absolute() else (BOT_DIR / path).resolve()


def load_timezone(name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(name or DEFAULT_TZ)
    except ZoneInfoNotFoundError as e:
        raise ConfigError(
            f"Невідомий часовий пояс TZ={name!r}. На Windows потрібен пакет tzdata (є в requirements.txt)."
        ) from e


def load_config() -> Config:
    token = (os.getenv("TELEGRAM_BOT_TOKEN") or "").strip()
    if not token:
        raise ConfigError("TELEGRAM_BOT_TOKEN не задано. Скопіюйте bot/.env.example у bot/.env і впишіть токен від @BotFather.")

    db_path = resolve_db_path(os.getenv("DB_PATH"))
    if not db_path.exists():
        raise ConfigError(f"База даних не знайдена: {db_path}. Спершу створіть її: npm run seed (у корені проєкту).")

    return Config(token=token, db_path=db_path, tz=load_timezone(os.getenv("TZ")))
