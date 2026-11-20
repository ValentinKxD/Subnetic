# Telegram-бот Subnetic (Python + aiogram 3).
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DB_PATH=/data/subnetic.db \
    TZ=Europe/Kyiv

WORKDIR /bot
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY config.py db.py handlers.py main.py reminders.py ./

RUN useradd --create-home --uid 1000 bot
USER bot
CMD ["python", "main.py"]
