# AwaazPay Backend (Laravel 13 + Filament 5)

Optional cloud services for the AwaazPay app. **The phone app works fully offline
without this** — the backend only powers: **staff / multi-device alerts**,
**server-updatable parser templates**, and **official IPN webhooks**.

## Setup

```bash
composer install
cp .env.example .env   # already scaffolded here
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

SQLite by default (`database/database.sqlite`). Seeds parser-template **v1** and an
admin login: **admin@awaazpay.pk / password** (change in prod).

Admin panel: `/admin` (Filament) — manage Shops, Devices, Payments, **ParserTemplates**
(bump version + set active to hot-update the app's wallet-parsing rules), StaffInvites,
and the WebhookEvents audit log.

## API

Base path `/api`. Device calls send `Authorization: Bearer <device_token>`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | – | Onboard a phone. `role=owner` creates a shop; `role=staff` joins via `invite_code` or `join_code`. Returns `device_token`. |
| GET | `/templates?platform=android&version=N` | – | Returns the active parser template only if newer than `N` (`{updated,version,payload}`). |
| POST | `/webhooks/{jazzcash\|easypaisa}` | signature | Official IPN. HMAC-verified, logged, → payment + fan-out to all shop devices. |
| POST | `/payments` | device | Upload a detected payment; deduped by `txn_id`; fanned out to the shop's **other** devices. |
| GET | `/payments?range=today\|week\|month\|all&source=` | device | Payments + totals + `by_source` breakdown. |
| POST | `/heartbeat` | device | Refresh `fcm_token` + presence. |
| POST | `/staff/invites` | owner | Mint a one-time invite code (24h). |
| GET | `/staff` | owner | List the shop's devices. |
| DELETE | `/staff/{device}` | owner | Remove a staff device (revokes access + push). |

## How staff alerts work

Owner's phone detects a payment locally (announces immediately) → uploads it to
`/payments` → backend pushes a **data-only FCM message** to every *other* active device
in the shop → those phones announce it too. Webhook payments (no local device detected
them) fan out to **all** shop devices.

## Services

- `App\Services\FcmService` — data pushes via FCM legacy HTTP; no-ops (logs) when
  `FCM_SERVER_KEY` is unset, so everything runs without live credentials. Swap to FCM
  HTTP v1 (service account) for production.
- `App\Services\WebhookVerifier` — JazzCash `pp_SecureHash` (salted, sorted-param HMAC)
  and Easypaisa (raw-body HMAC). **Field names + hashing must be confirmed against each
  provider's live spec + your assigned salt/secret** (see the `normalize()`/verify code).
- `App\Services\PaymentService` — dedupe + persist + fan-out; shared by device sync and
  webhooks.

## Env

```
FCM_SERVER_KEY=            # blank = push skipped (logged)
JAZZCASH_INTEGRITY_SALT=   # JazzCash IPN verification
EASYPAISA_WEBHOOK_SECRET=  # Easypaisa IPN verification
```

## Tests

```bash
php artisan test
```

20 passing (register/staff/join, payment sync + fan-out + dedupe + totals, template
versioning, webhook verify/reject/unknown-provider). See `tests/Feature/`.

## Not yet wired

The **app** doesn't call this backend yet — it currently runs offline-only. Phase 2 is
the RN API client: register on onboarding, pull templates on launch, sync payments,
receive FCM and announce. The endpoints above are ready for it.
