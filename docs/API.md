# API KIXO

Чтение каталога и карточек витрины выполняется через Prisma в Server Components.
REST `/api/products` отсутствует. Для внешнего оператора доступен небольшой read-only
маршрут; он не раскрывает покупателей, платежи, адреса или секреты.

## Каталог оператора

`GET /api/operator/catalog?query=Air%20Max&size=42&color=black`

`query` обязателен (1–100 символов); поддерживает модель/бренд и точный SKU.
`size` и `color` опциональны. Ответ — до четырёх товаров и до 16 вариантов каждого:
название, описание, цена в UZS, флаг `demo`, SKU, EU-размер, цвет, остаток.
Для точного SKU возвращается соответствующий вариант. Ограничение — 60 запросов
в минуту согласно настройкам доверенного proxy/IP. Ответы `Cache-Control: no-store`.

## HTTP маршруты

| Метод / путь | Назначение |
| --- | --- |
| POST `/api/cart/quote` | Проверить наличие, цены и итог с промокодом |
| POST `/api/orders` | Создать заказ с серверным пересчётом и идемпотентностью |
| POST `/api/coupon` | Проверить промокод для состава корзины |
| POST `/api/wishlist` | Установить состояние `{productId, saved: boolean}` |
| POST `/api/register` | Регистрация покупателя |
| GET/POST `/api/auth/[...nextauth]` | Сессия и вход Auth.js |
| POST `/api/newsletter` | Сохранить email подписки |
| POST `/api/admin/upload` | Admin-only presigned S3 URL |
| PUT `/api/admin/upload` | Admin-only подтверждение объекта и запись URL |
| GET `/api/health` | Liveness без секретов и данных |
| GET `/api/health?ready=1` | Readiness с PostgreSQL |

Все собственные JSON-мутации требуют `Content-Type: application/json` и `Origin`,
совпадающий с `NEXTAUTH_URL`. Размер JSON ограничен 32 KiB. Приватные действия
проверяют сессию/роль. Ответы об ошибках не содержат сообщений Prisma/S3 или
подробностей внутренней инфраструктуры.

## Создание заказа

```json
{
  "firstName": "Demo",
  "lastName": "Buyer",
  "phone": "+998901234567",
  "region": "Ташкент",
  "city": "Ташкент",
  "address": "Demo street, building 10",
  "payment": "cash",
  "items": [{"variantId": "ACTUAL_VARIANT_ID", "quantity": 1}],
  "coupon": "FIRST10",
  "idempotencyKey": "GENERATED_UUID",
  "expectedTotal": 1701000
}
```

`expectedTotal` берётся из актуального `/api/cart/quote`, а не вычисляется клиентом.
Пример суммы демонстрационный. Ключ должен быть UUID; повтор того же содержимого
с тем же ключом возвращает тот же заказ. Изменённое содержимое или цена — HTTP 409.
Ответ содержит `id` и `number`, а доступ к гостевому заказу выдаётся HttpOnly cookie.
Онлайн-оплата Click/Payme отклоняется, пока не установлен настоящий адаптер.

## Управление ассортиментом

Используется защищённая `/admin` и Server Actions в `src/server/admin-actions.ts`:
`saveProduct`, `archiveProduct`, `saveVariant`, `addVariant`, `saveTranslation`,
`addImage`, `deleteImage`, `saveTaxonomy`. `saveProduct` принимает флаг `demo`.
`saveVariant` дополнительно требует `expectedQuantity` — остаток при открытии формы.
Server Actions возвращают `{ok:true}` либо `{ok:false,error}` для понятного
отображения в production без утечки внутренних ошибок.
