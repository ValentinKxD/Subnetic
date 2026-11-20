-- Subnetic: початкові дані — каталог сервісів і курси валют (без користувачів)

-- ── Категорії ───────────────────────────────────────────────

INSERT INTO categories (id, slug, name) VALUES
  (1, 'streaming', 'Стримінг'),
  (2, 'cloud',     'Хмара'),
  (3, 'games',     'Ігри'),
  (4, 'education', 'Навчання'),
  (5, 'music',     'Музика'),
  (6, 'other',     'Інше'),
  (7, 'ai',        'ШІ');

-- ── Глобальні сервіси ───────────────────────────────────────

INSERT INTO services (id, category_id, owner_user_id, name, icon, brand_color, website) VALUES
  (1,  1, NULL, 'Netflix',                '/icons/netflix.svg',                '#E50914', 'https://www.netflix.com'),
  (2,  5, NULL, 'Spotify',                '/icons/spotify.svg',                '#1DB954', 'https://www.spotify.com'),
  (3,  1, NULL, 'YouTube Premium',        '/icons/youtube-premium.png',        '#FF0000', 'https://www.youtube.com/premium'),
  (4,  3, NULL, 'Xbox Game Pass',         '/icons/xbox-game-pass.png',         '#107C10', 'https://www.xbox.com/game-pass'),
  (5,  3, NULL, 'PS Plus',                '/icons/ps-plus.svg',                '#0070D1', 'https://www.playstation.com/ps-plus'),
  (6,  4, NULL, 'Coursera',               '/icons/coursera.png',               '#0056D2', 'https://www.coursera.org'),
  (7,  2, NULL, 'Google One',             '/icons/google-one.svg',             '#4285F4', 'https://one.google.com'),
  (8,  2, NULL, 'iCloud+',                '/icons/icloud-plus.png',            '#3693F3', 'https://www.icloud.com'),
  (9,  2, NULL, 'Dropbox',                '/icons/dropbox.svg',                '#0061FF', 'https://www.dropbox.com'),
  (10, 4, NULL, 'Duolingo',               '/icons/duolingo.png',               '#58CC02', 'https://www.duolingo.com'),
  (11, 6, NULL, 'Telegram',               '/icons/telegram.png',               '#0077FF', 'https://telegram.org'),
  (12, 7, NULL, 'ChatGPT',                '/icons/chatgpt.png',                '#10A37F', 'https://chatgpt.com'),
  (13, 7, NULL, 'Claude',                 '/icons/claude.png',                 '#D97757', 'https://claude.ai'),
  (14, 7, NULL, 'Google Gemini',          '/icons/gemini.png',                 '#4E7CF6', 'https://gemini.google.com'),
  (15, 7, NULL, 'Midjourney',             '/icons/midjourney.png',             '#1F1F1F', 'https://www.midjourney.com'),
  (16, 7, NULL, 'Perplexity',             '/icons/perplexity.png',             '#1F8A8A', 'https://www.perplexity.ai'),
  (17, 7, NULL, 'GitHub Copilot',         '/icons/github-copilot.png',         '#24292F', 'https://github.com/features/copilot'),
  (18, 1, NULL, 'MEGOGO',                 '/icons/megogo.png',                 '#0F62FE', 'https://megogo.net'),
  (19, 1, NULL, 'SWEET.TV',               '/icons/sweet-tv.png',               '#E5007E', 'https://sweet.tv'),
  (20, 5, NULL, 'Apple Music',            '/icons/apple-music.png',            '#FA243C', 'https://music.apple.com'),
  (21, 5, NULL, 'Deezer',                 '/icons/deezer.png',                 '#A238FF', 'https://www.deezer.com'),
  (22, 3, NULL, 'Nintendo Switch Online', '/icons/nintendo-switch-online.png', '#E60012', 'https://www.nintendo.com/switch/online'),
  (23, 4, NULL, 'Skillshare',             '/icons/skillshare.png',             '#00A87E', 'https://www.skillshare.com'),
  (24, 6, NULL, 'Notion',                 '/icons/notion.png',                 '#191919', 'https://www.notion.so'),
  (25, 6, NULL, 'Adobe Creative Cloud',   '/icons/adobe-cc.png',               '#DA1F26', 'https://www.adobe.com/creativecloud.html');

-- ── Глобальні тарифи ────────────────────────────────────────

INSERT INTO plans (id, service_id, user_id, name, price, currency, billing_period) VALUES
  (1,  1,  NULL, 'Базовий',              199,    'UAH', 'month'),
  (2,  1,  NULL, 'Стандартний',          299,    'UAH', 'month'),
  (3,  1,  NULL, 'Преміум',              399,    'UAH', 'month'),
  (4,  2,  NULL, 'Individual',           179,    'UAH', 'month'),
  (5,  2,  NULL, 'Duo',                  239,    'UAH', 'month'),
  (6,  2,  NULL, 'Family',               289,    'UAH', 'month'),
  (24, 2,  NULL, 'Student',              99,     'UAH', 'month'),
  (7,  3,  NULL, 'Індивідуальний',       149,    'UAH', 'month'),
  (8,  3,  NULL, 'Сімейний',             279,    'UAH', 'month'),
  (25, 3,  NULL, 'Студентський',         99,     'UAH', 'month'),
  (9,  4,  NULL, 'Core',                 6.99,   'USD', 'month'),
  (10, 4,  NULL, 'Ultimate',             19.99,  'USD', 'month'),
  (11, 5,  NULL, 'Essential',            1250,   'UAH', 'year'),
  (12, 5,  NULL, 'Extra',                920,    'UAH', 'quarter'),
  (13, 6,  NULL, 'Coursera Plus',        59,     'USD', 'month'),
  (14, 6,  NULL, 'Coursera Plus (рік)',  399,    'USD', 'year'),
  (15, 7,  NULL, '100 ГБ',               1.99,   'USD', 'month'),
  (16, 7,  NULL, '2 ТБ',                 9.99,   'USD', 'month'),
  (17, 8,  NULL, '50 ГБ',                0.99,   'USD', 'month'),
  (18, 8,  NULL, '200 ГБ',               2.99,   'USD', 'month'),
  (19, 9,  NULL, 'Plus',                 11.99,  'EUR', 'month'),
  (20, 9,  NULL, 'Essentials',           19.99,  'EUR', 'month'),
  (21, 10, NULL, 'Super',                3.49,   'USD', 'week'),
  (22, 10, NULL, 'Super (рік)',          59.99,  'USD', 'year'),
  (23, 11, NULL, 'Premium',              120,    'UAH', 'month'),
  (26, 12, NULL, 'Plus',                 20,     'USD', 'month'),
  (27, 12, NULL, 'Pro',                  200,    'USD', 'month'),
  (28, 13, NULL, 'Pro',                  20,     'USD', 'month'),
  (29, 13, NULL, 'Pro (рік)',            200,    'USD', 'year'),
  (30, 13, NULL, 'Max',                  100,    'USD', 'month'),
  (31, 14, NULL, 'AI Pro',               19.99,  'USD', 'month'),
  (32, 14, NULL, 'AI Ultra',             249.99, 'USD', 'month'),
  (33, 15, NULL, 'Basic',                10,     'USD', 'month'),
  (34, 15, NULL, 'Standard',             30,     'USD', 'month'),
  (35, 16, NULL, 'Pro',                  20,     'USD', 'month'),
  (36, 16, NULL, 'Pro (рік)',            200,    'USD', 'year'),
  (37, 17, NULL, 'Pro',                  10,     'USD', 'month'),
  (38, 17, NULL, 'Pro (рік)',            100,    'USD', 'year'),
  (39, 18, NULL, 'Оптимальна',           149,    'UAH', 'month'),
  (40, 18, NULL, 'Максимальна',          299,    'UAH', 'month'),
  (41, 19, NULL, 'M',                    139,    'UAH', 'month'),
  (42, 19, NULL, 'L',                    199,    'UAH', 'month'),
  (43, 20, NULL, 'Individual',           4.99,   'USD', 'month'),
  (44, 20, NULL, 'Student',              2.99,   'USD', 'month'),
  (45, 20, NULL, 'Family',               7.99,   'USD', 'month'),
  (46, 21, NULL, 'Premium',              5.99,   'EUR', 'month'),
  (47, 22, NULL, 'Individual (рік)',     19.99,  'USD', 'year'),
  (48, 22, NULL, 'Individual (квартал)', 7.99,   'USD', 'quarter'),
  (49, 23, NULL, 'Premium (рік)',        168,    'USD', 'year'),
  (50, 24, NULL, 'Plus',                 12,     'USD', 'month'),
  (51, 24, NULL, 'Plus (рік)',           120,    'USD', 'year'),
  (52, 25, NULL, 'Photography',          9.99,   'USD', 'month'),
  (53, 25, NULL, 'All Apps',             59.99,  'USD', 'month');

-- ── Курси валют ─────────────────────────────────────────────
-- Резервні значення на випадок, якщо НБУ ще жодного разу не був доступний.
-- Сервер при старті й щодоби завантажує курс НБУ (source = 'nbu'), і той має перевагу.

INSERT INTO exchange_rates (currency, rate_to_uah, rate_date, source, fetched_at) VALUES
  ('UAH', 1,    date('now', 'localtime'), 'seed', datetime('now')),
  ('USD', 41.5, date('now', 'localtime'), 'seed', datetime('now')),
  ('EUR', 45.2, date('now', 'localtime'), 'seed', datetime('now'));
