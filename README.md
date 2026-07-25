# Agapay: The Last-Mile Relief Engine

Agapay is a digital bridge between national relief programs (DSWD Walang Gutom Food
Stamp, Kadiwa ng Pangulo, LTFRB fuel subsidy) and the citizens who need them. It removes
leakage (non-eligible hoarding), wasted transport fares (citizens travel only when goods
are guaranteed), and cash-handling corruption by digitizing verification, allocation, and
redemption, with offline resilience for brownouts.

## How it works (4 phases)

1. **Verify and target:** cross-reference a citizen's PhilSys ID against the poverty
   database (mock Listahanan) or the PUV franchise list (mock LTFRB).
2. **Dynamic allocation (the "lock"):** atomically reserve inventory and issue a
   time-sensitive voucher (RSA-signed token, QR payload, and 6-digit SMS code).
3. **Redemption:** a merchant scans the token or SMS code; the ledger updates instantly.
4. **LGU dashboard and offline sync:** resilient offline redemption with idempotent batch
   sync, plus a per-barangay stock-depletion heat map for the Mayor and DRRMO.

Plus a public **Price Watch** for current fuel, transport fare, and market prices.

## Monorepo layout

| Path | What | Stack |
|------|------|-------|
| [`api/`](api/) | REST API backend | Laravel 13, PHP 8.5, JWT, MySQL locally / PostgreSQL (Neon) in production |
| [`app/`](app/) | Mobile app | Expo (React Native), NativeWind (Tailwind), React Query, Philippine-flag theme |

Full backend documentation, endpoints, and demo accounts: [`api/README.md`](api/README.md).

## Roles

- **Citizen:** check eligibility, browse locations, lock relief goods, hold a QR + SMS voucher.
- **Merchant:** redeem vouchers online, or queue them offline during a brownout and batch-sync later.
- **LGU admin (DRRMO):** view the stats and barangay heat map, manage published prices.

## Quick start

Backend (needs the `pdo_mysql` PHP extension and a MySQL server such as XAMPP):

```bash
cd api
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

Mobile app:

```bash
cd app
pnpm install
pnpm start   # then press i / a / w for iOS / Android / web
```

Point the app at your API with `EXPO_PUBLIC_API_URL`; it defaults to the deployed
Vercel API.

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](LICENSE).
