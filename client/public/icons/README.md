# Іконки сервісів

Сюди кладіть справжні іконки (логотипи) сервісів підписок. Файли з цієї теки
віддаються Vite за адресою `/icons/<файл>`.

## Правила

- Формат: **SVG** (бажано) або PNG 128×128 з прозорим фоном.
- Назва файлу — kebab-case, має збігатися з полем `icon` сервісу в
  `server/src/data/seed.ts`.
- Перевіряйте ліцензію / умови використання логотипів брендів.

## Очікувані файли

| Сервіс          | Файл                  |
| --------------- | --------------------- |
| Netflix         | `netflix.svg`         |
| Spotify         | `spotify.svg`         |
| YouTube Premium | `youtube-premium.svg` |
| Xbox Game Pass  | `xbox-game-pass.svg`  |
| PS Plus         | `ps-plus.svg`         |
| Coursera        | `coursera.svg`        |
| Google One      | `google-one.svg`      |
| iCloud+         | `icloud-plus.svg`     |
| Dropbox         | `dropbox.svg`         |
| Duolingo        | `duolingo.svg`        |

Поки файлу немає, інтерфейс має показувати запасний варіант — першу літеру
назви сервісу на фоні `brand_color`.

Новий сервіс: додайте запис у `seed.ts` з `icon: '/icons/<назва>.svg'` і покладіть
файл сюди.
