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

## Demo accounts

Passwords are **not** published here. This repository is public and the demo API is
live, so credentials are shared privately instead. Ask the maintainer, or seed your
own database locally with `php artisan migrate:fresh --seed`.

| Email | Username | Role | Use it to see |
|-------|----------|------|---------------|
| `citizen@agapay.test` | `maria` | Citizen | Food eligibility, claiming, reporting |
| `driver@agapay.test` | `jose` | Citizen | Fuel subsidy eligibility |
| `merchant@agapay.test` | `kadiwa` | Merchant | Redeeming, approved store |
| `pending@agapay.test` | `nena` | Merchant | The "waiting for LGU approval" screen |
| `mayor@agapay.test` | `mayor` | LGU admin | Dashboard, triage, approvals, publishing |

`agapay.test` is a reserved test domain, not a real mailbox.

---

# Feature guide: where everything lives

## Before you sign in

The sign-in screen carries two public links at the bottom, so a judge can see live data
without an account.

| Feature | How to get there |
|---------|------------------|
| Price Watch | Sign-in screen, **No account needed** > **Price Watch** |
| Impact map | Sign-in screen, **No account needed** > **Impact map** |
| Register | Sign-in screen, **Create an account** (pick Citizen or Merchant) |

A merchant who registers picks their store from the list on that screen, then waits for
an LGU to approve it.

## Citizen

Five tabs along the bottom: **Home, Relief, Impact, Alerts, Account**.

### Home
| Feature | How to get there |
|---------|------------------|
| What you can claim right now | The blue card at the top shows your headline program and cap |
| Grid alert banner | Appears under the tiles when the grid is on yellow/red alert |
| Claim reminders | Amber banner ("N plans to claim today"), only when a saved plan is due |
| Quick actions | Four tiles: **Claim**, **Prices**, **Report**, **Gabay** |
| Market snapshot | Scroll down for current prices |
| Latest alerts | Bottom of the page |
| Notifications | Bell icon, top right |

### Relief tab
Two segments at the top: **Claim relief** and **Price Watch**.

| Feature | How to get there |
|---------|------------------|
| Reserve goods | **Claim relief** > **Available**, pick a store, set quantity, Claim |
| Saved plans | **Claim relief** > **Saved** |
| Your QR + SMS voucher | **Claim relief** > **Vouchers** |
| Past claims | **Claim relief** > **History** |
| Prices by commodity | **Price Watch** segment |
| Price history chart | **Price Watch**, tap any item |

### Impact tab
| Feature | How to get there |
|---------|------------------|
| Choropleth map | Fills the top of the screen. Pinch to zoom, drag to pan |
| Switch metric | Toggle above the map: **Affected**, **Severity**, **Rainfall**, **Outages** |
| Province detail | Tap any province on the map |
| Always-on labels | Top provinces are labelled directly on the map, no tap needed |
| Hazard, weather and outage lists | Scroll below the map |

### Alerts tab
LGU and merchant announcements. Tap a card to like it or open its comment thread.

### Account tab
Two segments at the top: **Personal info** and **My reports**.

| Feature | How to get there |
|---------|------------------|
| Edit your details | **Personal info** > **Edit** next to Personal details |
| Change password / sign out | **Personal info**, scroll to Security |
| **File a report** | **My reports** > **Report an incident** |
| **Track a report** | **My reports**, each card shows a Submitted > Reviewed > Referred > Resolved tracker |
| Filter reports | **My reports**, chips: All, Under review, In progress, Resolved, Dismissed |
| **Message your LGU** | Open any report card, tap **Messages** > **Open** |
| Responding agency | Shown on the report card once the LGU refers it |

### Filing a report
Reached from Home > **Report** tile, or Account > My reports > **Report an incident**.

1. Pick the incident type from the chips.
2. Write a title and description.
3. Set the location: **Use my current location** (GPS), or search a province.
4. Once a province is set, its **island group map opens on its own**, zoomed in. Pick
   Mindanao and Luzon and Visayas are stripped away entirely. Tap the map to move the pin.
5. Optionally attach a photo.
6. **Send report**, then follow it under Account > My reports.

## Merchant

Five tabs: **Redeem, Offline, Impact, Alerts, Account**.

A newly registered merchant lands on a **Waiting for LGU approval** screen instead of the
tabs, showing account created > store assigned > LGU approval. Sign in as
`pending@agapay.test` to see it. Redeeming is blocked on the server too, not just hidden.

### Redeem tab
| Feature | How to get there |
|---------|------------------|
| Your store, power status, offline readiness | The blue card at the top |
| Scan a voucher QR | **Scan** segment, point the camera |
| Enter a 6-digit SMS code | **SMS** segment |
| Paste a voucher token | **Token** segment |
| Result | Green confirmation card appears below with the quantity to hand over |

### Offline tab
For brownouts. Signature verification happens on the device, with no connection.

| Feature | How to get there |
|---------|------------------|
| Queue a redemption offline | Same three segments: Scan, SMS, Token |
| See what is queued | **Waiting to sync** list |
| Push them to the server | **Sync** button at the bottom |
| Sync outcome per item | **Last sync result** appears after syncing |

## LGU admin

Six tabs: **Home, Alerts, Prices, Gabay, Risk, Account**.

### Home
| Feature | How to get there |
|---------|------------------|
| Vouchers out right now | The blue card at the top |
| Reports awaiting review | Red banner, only when reports are pending |
| **Stores awaiting approval** | Amber banner, only when merchants are pending |
| Quick actions | Four tiles: **Reports**, **Relief**, **Prices**, **Risk** |
| **Approve merchants** | **Manage** > **Merchants** row (always visible, with a count badge) |
| Leakage prevented | Scroll down: ghost, duplicate and over-cap claims refused |
| Subsidies, redemptions, barangay stock | Continue scrolling |

### Incident triage
Home > **Reports** tile, or the red banner.

| Feature | How to get there |
|---------|------------------|
| Filter by stage | Chips: All, Under review, In progress, Resolved, Dismissed |
| Open a report | Tap the card header to expand it |
| Verify or dismiss | Buttons inside an expanded **Under review** report |
| Mark resolved | Button inside an expanded **verified** report |
| Publish to the public map | **Publish to impact map** |
| Move the referral along | Inside the report: Send to agency > Mark acknowledged > Close referral |
| **Reply to the reporter** | **Messages** > **Open** inside the report |

### Merchant approval
Home > **Manage** > **Merchants**.

| Feature | How to get there |
|---------|------------------|
| See who is waiting | **Pending** chip (the default) |
| Approve a store | **Approve store** on the card |
| Pause a store | **Approved** chip, then **Pause store** |

Approving notifies the merchant and unlocks redeeming immediately.

### Relief operations
Home > **Relief** tile.

Add service points, restock inventory, and set per-program caps. Two segments:
**Kadiwa store** and **Fuel station**.

### Prices tab
Publish and update the prices citizens see. Buttons stay disabled until the form is filled.

### Gabay tab
Publish requirement guides (SSS, PhilHealth, PSA, and so on).

| Feature | How to get there |
|---------|------------------|
| Publish a guide | Fill the form at the top, **Publish guide** |
| **Edit a guide** | Pencil icon on any published guide; the form jumps to the top, prefilled |
| Delete a guide | Trash icon |

### Risk tab
Two segments: **Hazards** and **Power**.

| Feature | How to get there |
|---------|------------------|
| Publish a hazard | **Hazards** segment, fill the form, **Publish hazard** |
| Edit or delete a hazard | Pencil or trash icon. USGS-synced quakes have neither, since the next sync would overwrite any edit |
| Declare a brownout | **Power** segment, pick barangay and window, **Declare interruption** |
| Edit or remove an interruption | Pencil or trash icon on the entry |
| See which stores lost power | **Power** segment, Service points list |

---

## Monorepo layout

| Path | What | Stack |
|------|------|-------|
| [`api/`](api/) | REST API backend | Laravel 13, PHP 8.4, JWT, MySQL locally / PostgreSQL (Neon) in production |
| [`app/`](app/) | Mobile app | Expo (React Native), NativeWind (Tailwind), React Query, Philippine-flag theme |

Full backend documentation, endpoints, and demo accounts: [`api/README.md`](api/README.md).

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

## Building an APK

```bash
cd app
npx eas-cli@latest build --platform android --profile preview
```

The `preview` profile produces an installable APK rather than a Play Store bundle. Both
`.easignore` files anchor their patterns (`/api/`, not `api/`), because an unanchored
pattern also matches `app/src/lib/api` and silently drops it from the upload.

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](LICENSE).
