-- Subnetic: схема бази даних SQLite

PRAGMA foreign_keys = ON;

-- ── Користувачі ─────────────────────────────────────────────

CREATE TABLE users (
  id                INTEGER PRIMARY KEY,
  nickname          TEXT    NOT NULL UNIQUE COLLATE NOCASE
                    CHECK (length(nickname) BETWEEN 3 AND 32 AND instr(nickname, '@') = 0),
  email             TEXT    NOT NULL UNIQUE COLLATE NOCASE
                    CHECK (email LIKE '_%@_%._%'),
  phone             TEXT    NULL CHECK (phone IS NULL OR length(phone) BETWEEN 10 AND 16),
  -- SHA-256 (hex, 64 символи) без солі — спрощення для курсової.
  password_hash     TEXT    NOT NULL CHECK (length(password_hash) = 64),
  telegram_chat_id  INTEGER NULL UNIQUE,
  telegram_username TEXT    NULL,
  telegram_linked_at TEXT   NULL CHECK (telegram_linked_at IS NULL OR telegram_linked_at IS datetime(telegram_linked_at)),
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  -- Роль: 'admin' бачить адмін-панель. Першого адміністратора призначає npm run make-admin.
  role              TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  -- Час блокування адміністратором; NULL — обліковий запис активний.
  blocked_at        TEXT    NULL CHECK (blocked_at IS NULL OR blocked_at IS datetime(blocked_at))
);

-- Журнал дій адміністраторів (хто, що і коли змінив).
CREATE TABLE admin_log (
  id         INTEGER PRIMARY KEY,
  admin_id   INTEGER NULL REFERENCES users (id) ON DELETE SET NULL,
  action     TEXT    NOT NULL,
  details    TEXT    NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX ix_admin_log_created ON admin_log (created_at DESC);

CREATE TABLE user_settings (
  user_id     INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  currency    TEXT    NOT NULL DEFAULT 'UAH'   CHECK (currency IN ('UAH', 'USD', 'EUR')),
  theme       TEXT    NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  remind_7    INTEGER NOT NULL DEFAULT 1 CHECK (remind_7 IN (0, 1)),
  remind_3    INTEGER NOT NULL DEFAULT 1 CHECK (remind_3 IN (0, 1)),
  remind_1    INTEGER NOT NULL DEFAULT 1 CHECK (remind_1 IN (0, 1)),
  remind_hour INTEGER NOT NULL DEFAULT 10 CHECK (remind_hour BETWEEN 0 AND 23)
);

-- Одноразові токени для прив'язки Telegram-бота до акаунта.
CREATE TABLE telegram_link_tokens (
  token      TEXT    PRIMARY KEY CHECK (length(token) >= 16),
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TEXT    NOT NULL CHECK (expires_at IS datetime(expires_at))
);

-- ── Каталог ─────────────────────────────────────────────────

CREATE TABLE categories (
  id   INTEGER PRIMARY KEY,
  slug TEXT    NOT NULL UNIQUE CHECK (slug GLOB '[a-z]*' AND slug NOT GLOB '*[^a-z0-9-]*'),
  name TEXT    NOT NULL UNIQUE CHECK (length(trim(name)) > 0)
);

-- owner_user_id IS NULL — глобальний сервіс каталогу, інакше — власний сервіс користувача.
CREATE TABLE services (
  id            INTEGER PRIMARY KEY,
  category_id   INTEGER NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  owner_user_id INTEGER NULL REFERENCES users (id) ON DELETE CASCADE,
  name          TEXT    NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 60),
  icon          TEXT    NULL,
  website       TEXT    NULL CHECK (website IS NULL OR website LIKE 'http%://%'),
  brand_color   TEXT    NOT NULL DEFAULT '#64748B'
                CHECK (brand_color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]')
);
-- Назва унікальна в межах власника (NULL у UNIQUE не порівнюється, тому IFNULL).
CREATE UNIQUE INDEX ux_services_owner_name ON services (IFNULL(owner_user_id, 0), name COLLATE NOCASE);

-- user_id IS NULL — глобальний тариф, інакше — власний тариф користувача.
CREATE TABLE plans (
  id             INTEGER PRIMARY KEY,
  service_id     INTEGER NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  user_id        INTEGER NULL REFERENCES users (id) ON DELETE CASCADE,
  name           TEXT    NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 60),
  price          REAL    NOT NULL CHECK (price >= 0),
  currency       TEXT    NOT NULL CHECK (currency IN ('UAH', 'USD', 'EUR')),
  billing_period TEXT    NOT NULL CHECK (billing_period IN ('week', 'month', 'quarter', 'year'))
);
CREATE INDEX ix_plans_service ON plans (service_id);

-- ── Способи оплати ──────────────────────────────────────────

CREATE TABLE payment_methods (
  id      INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title      TEXT    NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 40),
  type       TEXT    NOT NULL CHECK (type IN ('card', 'paypal', 'apple_pay', 'google_pay', 'bank', 'other')),
  last4      TEXT    NULL CHECK (last4 IS NULL OR last4 GLOB '[0-9][0-9][0-9][0-9]'),
  details    TEXT    NOT NULL DEFAULT '' CHECK (length(details) <= 60),
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1))
);
CREATE INDEX ix_payment_methods_user ON payment_methods (user_id);
-- Не більше одного основного способу оплати на користувача.
CREATE UNIQUE INDEX ux_payment_methods_default ON payment_methods (user_id) WHERE is_default = 1;

-- ── Підписки ────────────────────────────────────────────────

CREATE TABLE subscriptions (
  id                INTEGER PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  plan_id           INTEGER NOT NULL REFERENCES plans (id) ON DELETE RESTRICT,
  payment_method_id INTEGER NULL REFERENCES payment_methods (id) ON DELETE SET NULL,
  status            TEXT    NOT NULL DEFAULT 'active'
                    CHECK (status IN ('trial', 'active', 'paused', 'cancelled', 'expired')),
  start_date        TEXT    NOT NULL CHECK (start_date IS date(start_date)),
  trial_end_date    TEXT    NULL CHECK (trial_end_date IS NULL OR (trial_end_date IS date(trial_end_date) AND trial_end_date > start_date)),
  next_payment_date TEXT    NULL CHECK (next_payment_date IS NULL OR next_payment_date IS date(next_payment_date)),
  auto_renew        INTEGER NOT NULL DEFAULT 1 CHECK (auto_renew IN (0, 1)),
  cancelled_at      TEXT    NULL CHECK (cancelled_at IS NULL OR cancelled_at IS datetime(cancelled_at)),
  note              TEXT    NULL CHECK (note IS NULL OR length(note) <= 500)
);
CREATE INDEX ix_subscriptions_user_status ON subscriptions (user_id, status);
CREATE INDEX ix_subscriptions_next_payment ON subscriptions (next_payment_date);

-- ── Платежі ─────────────────────────────────────────────────

CREATE TABLE payments (
  id                INTEGER PRIMARY KEY,
  subscription_id   INTEGER NOT NULL REFERENCES subscriptions (id) ON DELETE CASCADE,
  amount            REAL    NOT NULL CHECK (amount >= 0),
  currency          TEXT    NOT NULL CHECK (currency IN ('UAH', 'USD', 'EUR')),
  -- За яку дату графіка платіж (next_payment_date на момент оплати).
  due_date          TEXT    NOT NULL CHECK (due_date IS date(due_date)),
  status            TEXT    NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'failed', 'refunded')),
  paid_at           TEXT    NOT NULL DEFAULT (datetime('now')) CHECK (paid_at IS datetime(paid_at)),
  payment_method_id INTEGER NULL REFERENCES payment_methods (id) ON DELETE SET NULL
);
CREATE INDEX ix_payments_subscription_paid ON payments (subscription_id, paid_at);
CREATE INDEX ix_payments_due_date ON payments (due_date);

-- ── Нагадування ─────────────────────────────────────────────

-- Журнал нагадувань: один запис на (підписка, дата платежу, за скільки днів)
CREATE TABLE reminders (
  id              INTEGER PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions (id) ON DELETE CASCADE,
  due_date        TEXT    NOT NULL CHECK (due_date IS date(due_date)),
  days_before     INTEGER NOT NULL CHECK (days_before IN (1, 3, 7)),
  sent_at         TEXT    NULL CHECK (sent_at IS NULL OR sent_at IS datetime(sent_at)),
  UNIQUE (subscription_id, due_date, days_before)
);

-- ── Курси валют ─────────────────────────────────────────────

-- Історія курсів: один запис на валюту й дату курсу НБУ (rate_date)
CREATE TABLE exchange_rates (
  id          INTEGER PRIMARY KEY,
  currency    TEXT    NOT NULL CHECK (currency IN ('UAH', 'USD', 'EUR')),
  rate_to_uah REAL    NOT NULL CHECK (rate_to_uah > 0),
  rate_date   TEXT    NOT NULL CHECK (rate_date IS date(rate_date)),
  source      TEXT    NOT NULL DEFAULT 'seed' CHECK (source IN ('nbu', 'seed')),
  fetched_at  TEXT    NOT NULL DEFAULT (datetime('now')) CHECK (fetched_at IS datetime(fetched_at))
);
CREATE UNIQUE INDEX ux_exchange_rates_currency_date ON exchange_rates (currency, rate_date);

-- ── Подання (VIEW) ──────────────────────────────────────────

-- Актуальний курс кожної валюти: НБУ має перевагу над резервним
CREATE VIEW v_current_rates AS
SELECT currency, rate_to_uah, rate_date, source, fetched_at
FROM (
  SELECT
    e.*,
    row_number() OVER (
      PARTITION BY e.currency
      ORDER BY e.source = 'nbu' DESC, e.rate_date DESC, e.fetched_at DESC
    ) AS rn
  FROM exchange_rates e
)
WHERE rn = 1;

-- Підписка + тариф + сервіс + категорія + спосіб оплати.
CREATE VIEW v_subscription_details AS
SELECT
  s.id                AS subscription_id,
  s.user_id,
  s.status,
  s.start_date,
  s.trial_end_date,
  s.next_payment_date,
  s.auto_renew,
  s.cancelled_at,
  s.note,
  p.id                AS plan_id,
  p.name              AS plan_name,
  p.price,
  p.currency,
  p.billing_period,
  sv.id               AS service_id,
  sv.name             AS service_name,
  sv.icon             AS service_icon,
  sv.brand_color,
  c.id                AS category_id,
  c.name              AS category_name,
  pm.id               AS payment_method_id,
  pm.title            AS payment_method_title,
  -- Генерує списання: активна або пробна з автопродовженням.
  (s.status = 'active' OR (s.status = 'trial' AND s.auto_renew = 1)) AS is_billable
FROM subscriptions s
JOIN plans p       ON p.id = s.plan_id
JOIN services sv   ON sv.id = p.service_id
JOIN categories c  ON c.id = sv.category_id
LEFT JOIN payment_methods pm ON pm.id = s.payment_method_id;

-- Місячна вартість кожної підписки: у валюті тарифу і в гривнях
CREATE VIEW v_subscription_monthly_cost AS
SELECT
  d.subscription_id,
  d.user_id,
  d.service_name,
  d.plan_name,
  d.status,
  d.is_billable,
  d.price,
  d.currency,
  d.billing_period,
  round(m.monthly, 2)                AS monthly_price,
  round(m.monthly * r.rate_to_uah, 2) AS monthly_uah
FROM v_subscription_details d
JOIN (
  SELECT
    subscription_id,
    CASE billing_period
      WHEN 'week'    THEN price * 52.0 / 12
      WHEN 'month'   THEN price
      WHEN 'quarter' THEN price / 3.0
      WHEN 'year'    THEN price / 12.0
    END AS monthly
  FROM v_subscription_details
) m ON m.subscription_id = d.subscription_id
JOIN v_current_rates r ON r.currency = d.currency;

-- Найближчі платежі: підписки, що генерують списання, з датою від сьогодні.
CREATE VIEW v_upcoming_payments AS
SELECT
  d.subscription_id,
  d.user_id,
  d.service_name,
  d.plan_name,
  d.category_name,
  d.status,
  d.next_payment_date                                                  AS due_date,
  CAST(julianday(d.next_payment_date) - julianday(date('now', 'localtime')) AS INTEGER) AS days_left,
  d.price                                                              AS amount,
  d.currency,
  round(d.price * r.rate_to_uah, 2)                                    AS amount_uah,
  d.payment_method_title
FROM v_subscription_details d
JOIN v_current_rates r ON r.currency = d.currency
WHERE d.is_billable = 1
  AND d.next_payment_date IS NOT NULL
  AND d.next_payment_date >= date('now', 'localtime')
ORDER BY d.next_payment_date, d.service_name;

-- ── Тригери ─────────────────────────────────────────────────

-- Після успішної оплати: наступна дата зсувається на період тарифу, пробна стає активною
CREATE TRIGGER trg_payments_advance_schedule
AFTER INSERT ON payments
WHEN NEW.status = 'paid'
BEGIN
  UPDATE subscriptions
  SET
    next_payment_date = CASE
      WHEN next_payment_date IS NULL THEN NULL
      ELSE (
        SELECT CASE p.billing_period
          WHEN 'week'    THEN date(subscriptions.next_payment_date, '+7 days')
          WHEN 'month'   THEN date(subscriptions.next_payment_date, '+1 month', 'floor')
          WHEN 'quarter' THEN date(subscriptions.next_payment_date, '+3 months', 'floor')
          WHEN 'year'    THEN date(subscriptions.next_payment_date, '+12 months', 'floor')
        END
        FROM plans p
        WHERE p.id = subscriptions.plan_id
      )
    END,
    status = CASE WHEN status = 'trial' THEN 'active' ELSE status END
  WHERE id = NEW.subscription_id;
END;

-- Скасування: фіксуємо момент (якщо не передано явно).
CREATE TRIGGER trg_subscriptions_cancelled_insert
AFTER INSERT ON subscriptions
WHEN NEW.status = 'cancelled' AND NEW.cancelled_at IS NULL
BEGIN
  UPDATE subscriptions SET cancelled_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trg_subscriptions_cancelled_update
AFTER UPDATE OF status ON subscriptions
WHEN NEW.status = 'cancelled' AND OLD.status <> 'cancelled'
BEGIN
  UPDATE subscriptions SET cancelled_at = datetime('now') WHERE id = NEW.id;
END;

-- Відновлення скасованої підписки: позначку скасування знімаємо.
CREATE TRIGGER trg_subscriptions_uncancelled
AFTER UPDATE OF status ON subscriptions
WHEN OLD.status = 'cancelled' AND NEW.status <> 'cancelled'
BEGIN
  UPDATE subscriptions SET cancelled_at = NULL WHERE id = NEW.id;
END;
