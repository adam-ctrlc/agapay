# Agapay API, The Last-Mile Relief Engine

Laravel (API-only) backend for Agapay: a digital bridge between national relief
programs (DSWD Walang Gutom Food Stamp, Kadiwa ng Pangulo, LTFRB fuel subsidy) and
eligible citizens. It removes leakage (non-eligible hoarding), wasted transport fares
(citizens travel only when goods are guaranteed), and cash-handling corruption by
digitizing verification, allocation, and redemption.

## How it works (4 phases)

1. **Verify & target:** cross-reference a citizen's PhilSys ID against the poverty
   database (mock Listahanan) or the PUV franchise list (mock LTFRB).
2. **Dynamic allocation (the "lock"):** atomically reserve inventory and issue a
   time-sensitive voucher (RSA-signed token, QR payload, and 6-digit SMS code).
3. **Redemption:** a merchant scans the token or SMS code; the ledger updates instantly.
4. **LGU dashboard + offline sync:** resilient offline redemption with idempotent batch
   sync, plus a per-barangay stock-depletion heat map for the Mayor / DRRMO.

Plus a public **Price Watch** API (current PH fuel, transport fare, and commodity prices).

## Stack

- Laravel 13, PHP 8.5
- Auth: stateless **JWT** via `firebase/php-jwt` (custom `viaRequest` guard)
- DB: **MySQL** locally (XAMPP), written **PostgreSQL-portable** for Neon in production
- Service-layer architecture, API Resources, Form Requests, backed enums
- Vouchers signed with RSA (public key published so merchant apps verify offline)

## Local setup (XAMPP MySQL)

Requires the `pdo_mysql` PHP extension enabled and XAMPP MySQL running on `127.0.0.1:3306`.

```bash
composer install
cp .env.example .env        # already configured for mysql / ayudalock
php artisan key:generate
# create databases
php -r '$p=new PDO("mysql:host=127.0.0.1","root",""); $p->exec("CREATE DATABASE IF NOT EXISTS ayudalock"); $p->exec("CREATE DATABASE IF NOT EXISTS ayudalock_testing");'
php artisan migrate:fresh --seed
php artisan serve
```

Key env vars (see `.env.example`): `DB_*`, `JWT_SECRET`, `JWT_TTL`, `AUTH_GUARD=api`,
`VOUCHER_TTL_MINUTES`, and (optional, for serverless) `VOUCHER_PRIVATE_KEY` and
`VOUCHER_PUBLIC_KEY`.

## Demo accounts

Passwords are not published here; this repo is public and the demo API is live.
Seeding locally creates these accounts with a password you control via
`DEMO_PASSWORD` (defaults to `password` for local development only).

| Email | Role | Notes |
|-------|------|-------|
| `citizen@ayudalock.test` | citizen | Maria Santos, food-eligible (`PSN-0001-0001-0001`) |
| `driver@ayudalock.test` | citizen | Jose Dela Cruz, fuel-eligible (`PSN-0002-0002-0002`, plate `NGP-1234`) |
| `merchant@ayudalock.test` | merchant | Kadiwa vendor, bound to a Kadiwa store |
| `mayor@ayudalock.test` | lgu_admin | City DRRMO / dashboard + price management |

## API

All protected routes use `Authorization: Bearer <jwt>`. Role gating via `role:` middleware.

### Auth
- `POST /api/auth/register`: name, email, password, password_confirmation, role, optional phil_sys_id / location_id (required for merchant)
- `POST /api/auth/login`: returns `{ token, token_type, expires_in, user }`
- `GET  /api/auth/me`, `POST /api/auth/refresh`, `POST /api/auth/logout`

### Phase 1, Verify (citizen)
- `POST /api/eligibility/verify`: eligible programs for the authenticated citizen

### Phase 2, Allocate (citizen)
- `GET    /api/locations?type=&barangay_id=&commodity_id=`: locations with live stock
- `GET    /api/locations/{location}`
- `POST   /api/allocations`: body `{ location_id, commodity_id, quantity }`, returns allocation + voucher (token, qr_payload, sms_code, expires_at)
- `GET    /api/allocations`: my allocations
- `DELETE /api/allocations/{allocation}`: release a lock

### Phase 3, Redeem (merchant)
- `POST /api/redemptions`: `{ token }` or `{ sms_code }`, optional `client_uuid`
- `POST /api/redemptions/batch`: offline batch `{ items: [{ client_uuid, token|sms_code, redeemed_at }] }` (idempotent on `client_uuid`)
- `GET  /api/keys/voucher-public`: RSA public key for offline verification (public)

### Phase 4, Dashboard (lgu_admin)
- `GET /api/dashboard/heatmap`: per-barangay stock depletion
- `GET /api/dashboard/stats`: totals, redemptions by location, subsidies by program

### Price Watch (public read, admin write)
- `GET /api/prices?category=fuel|fare|commodity&region=`: current prices with trend + % change (public)
- `GET /api/prices/{price}/history`: price history for trend charts (public)
- `POST /api/prices`, `PUT /api/prices/{price}`: manage prices (lgu_admin)

## Offline resilience

Vouchers are RSA-signed. A merchant device caches the public key
(`GET /api/keys/voucher-public`) and can validate scanned tokens **offline** during a
brownout. Captured redemptions carry a `client_uuid`; when connectivity returns, the
device POSTs them to `/api/redemptions/batch`, which is idempotent on `client_uuid`, so
replays never double-spend.

## Testing

```bash
php artisan test
```

30 feature tests cover eligibility, atomic locking (including no-oversell across citizens),
redemption (token/SMS, double-spend, expiry, wrong-location), offline batch idempotency,
dashboard aggregates, price watch, and role authorization.

## Deploying to Vercel (with Neon Postgres)

The repo is Vercel-ready via the community `vercel-php@0.9.0` runtime:
- `api/index.php` forwards to `public/index.php`
- `vercel.json` sets the runtime, routes all traffic to the function, and points Laravel's
  caches to `/tmp` (the serverless filesystem is read-only)
- `.vercelignore` excludes `/vendor` (Vercel runs `composer install`)

Steps:
1. Create a **Neon** Postgres database; note host, db, user, password.
2. Set project **Environment Variables** in Vercel (never commit these):
   - `APP_KEY`: `php artisan key:generate --show`
   - `JWT_SECRET`: any 32-byte base64 secret
   - `VOUCHER_PRIVATE_KEY` and `VOUCHER_PUBLIC_KEY`: run `php artisan voucher:keys` and paste both
   - `DB_HOST`, `DB_PORT=5432`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
   - (`DB_CONNECTION=pgsql` and `DB_SSLMODE=require` are already in `vercel.json`)
3. Run migrations against Neon once (from your machine): point `.env` DB_* at Neon with
   `DB_CONNECTION=pgsql`, then `php artisan migrate --force --seed`.
4. Deploy (`vercel` or Git integration). No app code changes are needed for Postgres,
   the schema and queries are portable.

Because the voucher keys come from env, every serverless instance signs and verifies with
the same keypair, so redemptions work regardless of which instance handles the request.
