"""Запуск Telegram-бота Subnetic: Bot, Dispatcher, планувальник нагадувань, long polling."""

from __future__ import annotations

import asyncio
import logging
import os
import sys
from datetime import datetime

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.telegram import TelegramAPIServer
from aiogram.enums import ParseMode
from aiogram.types import BotCommand
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

import handlers
from config import ConfigError, load_config
from reminders import send_due_reminders

log = logging.getLogger("subnetic.bot")


async def main() -> None:
    try:
        cfg = load_config()
    except ConfigError as e:
        log.error("%s", e)
        sys.exit(1)

    # Час у логах — за TZ із .env (на Windows змінна TZ=Europe/Kyiv не впливає на localtime).
    logging.Formatter.converter = staticmethod(lambda ts: datetime.fromtimestamp(ts, cfg.tz).timetuple())  # type: ignore[assignment]

    # TELEGRAM_API_SERVER — необов'язково: власний Bot API сервер (або фейковий у тестах).
    api_server = os.getenv("TELEGRAM_API_SERVER")
    session = AiohttpSession(api=TelegramAPIServer.from_base(api_server)) if api_server else None
    bot = Bot(cfg.token, session=session, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    # db_path потрапляє в хендлери як аргумент (workflow data aiogram).
    dp = Dispatcher(db_path=cfg.db_path, tz=cfg.tz)
    dp.include_router(handlers.router)

    me = await bot.get_me()
    log.info("Бот @%s запущено. БД: %s, часовий пояс: %s", me.username, cfg.db_path, cfg.tz.key)
    await bot.set_my_commands(
        [
            BotCommand(command="start", description="Стан підключення"),
            BotCommand(command="account", description="Мій акаунт і підписки"),
            BotCommand(command="help", description="Довідка"),
        ]
    )

    async def send(chat_id: int, text: str) -> None:
        await bot.send_message(chat_id, text)

    async def reminders_job() -> None:
        try:
            await send_due_reminders(cfg.db_path, cfg.tz, send)
        except Exception:  # помилка БД тощо: логуємо, планувальник і бот працюють далі
            log.exception("Збій перевірки нагадувань")

    scheduler = AsyncIOScheduler(timezone=cfg.tz)
    # Щогодини на початку години. coalesce/max_instances — без «нагону» пропущених запусків і накладань.
    scheduler.add_job(
        reminders_job,
        CronTrigger(minute=0, timezone=cfg.tz),
        id="reminders",
        coalesce=True,
        max_instances=1,
        misfire_grace_time=15 * 60,
    )
    scheduler.start()
    # Одразу після старту — перевірка поточної години (дублі відсіче UNIQUE у reminders).
    await reminders_job()

    try:
        await dp.start_polling(bot)
    finally:
        scheduler.shutdown(wait=False)
        await bot.session.close()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("Бота зупинено")
