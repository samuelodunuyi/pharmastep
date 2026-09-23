# PharmaStep Web

Online pharmacy for Lagos. Next.js 16 (App Router) on Vercel, Supabase (Postgres, Auth, Storage), Prisma 7, Paystack.

## What's in it

- **Storefront**: search, categories, filters (form, Rx/OTC), product pages with dosage details
- **Cart**: works for guests and signed-in users; the guest cart merges into the account at sign-in
- **Checkout**: guest or signed in. The server prices the order and works out the delivery fee from the address. Payment goes through Paystack's hosted page, and the order is marked paid only after Paystack confirms it (redirect and webhook, both verified with the secret key).
- **Prescriptions**: Rx items need an uploaded prescription (private bucket). Pharmacists approve it, or reject it, which refunds automatically.
- **Order tracking**: customers see a status timeline; guests look orders up by number and email
- **Ask a pharmacist chat**: an in-app chat on every storefront page. An assistant (Claude) handles mild, over-the-counter cases and suggests only in-stock, non-prescription products from the catalogue. Anything moderate or worse, emergency wording, or a customer who asks goes to a pharmacist, who takes over from `/admin/chats`. Customers find all their chats at `/chats`, where they can continue one (writing in a closed chat reopens it) or start a new one; guests' chats are kept by a cookie and move to their account when they sign in.
- **Admin** (`/admin`): orders, prescription queue, chats, products and images, categories, staff roles, contact messages

## First-time setup

1. **Supabase project** (supabase.com, region: EU West is closest to Lagos)
   - Copy `.env.example` to `.env`, then fill in the URL, publishable key and secret key (Project Settings → API Keys)
   - Fill in `DATABASE_URL` (transaction pooler, port 6543) and `DIRECT_URL` (session, port 5432) from **Connect → ORMs → Prisma**
   - Authentication → URL Configuration: set Site URL to your domain, and add `http://localhost:3000/**` and `https://<your-domain>/**` to the redirect URLs
   - Authentication → Providers: enable Google (you'll need a Google OAuth client; the callback URL is shown there)
   - Keep **Confirm email** switched on
2. **Install, create the tables, set up storage**
   ```sh
   npm install
   npm run db:deploy          # creates tables and turns on row-level security
   npm run db:seed            # categories
   npx tsx scripts/setup-supabase.ts   # storage buckets
   ```
3. **Paystack**: put `PAYSTACK_SECRET_KEY` in `.env` (start with `sk_test_…`). In the Paystack dashboard, set the webhook URL to `https://<your-domain>/api/paystack/webhook`.
4. **Google Maps (optional)**: a server key with the Geocoding API and Routes API enabled prices delivery by distance, using the old site's fee bands. Without it, `DELIVERY_FLAT_FEE_NAIRA` is charged.
5. **Chat assistant (optional)**: put `ANTHROPIC_API_KEY` in `.env`. It uses Claude Opus 5.5 (`claude-opus-5-5`) unless `ANTHROPIC_MODEL` says otherwise. Without a key the chat still works, and every conversation goes straight to the pharmacists.
6. Create the first admin: `npx tsx scripts/create-admin.ts you@yourdomain.com "Your Name"`. It prints a temporary password; sign in at `/admin/login` and choose your own. Add more staff from `/admin/staff`. Staff accounts are separate from customer accounts. The public sign-up only creates customers.

## Moving data from Firebase

1. Firebase console → Project settings → Service accounts → **Generate new private key**. Save it as `firebase-service-account.json` in the project root (it's git-ignored).
2. Dry run, then the real run:
   ```sh
   npx tsx scripts/migrate-from-firebase.ts --dry-run
   npx tsx scripts/migrate-from-firebase.ts --default-stock=50
   ```
   - Products are imported with their images copied into Supabase Storage. The old site had no stock tracking, so every product starts at `--default-stock`. Set real stock levels in `/admin/products`.
   - Users get Supabase accounts with their email already confirmed but **no password**: each person uses "Forgot password" once. Google users just sign in with Google.
   - Orders are imported as read-only history (marked "old site").
   - Re-running is safe; every record is keyed by its Firebase ID.

## Deploying to Vercel

Import the repo, add every variable from `.env` (set `NEXT_PUBLIC_SITE_URL` to the production URL), and deploy. The build runs `prisma generate`. Run `npm run db:deploy` against production whenever `prisma/migrations` changes.

Before going live: switch to the Paystack live secret key, restrict the Google Maps key to the Geocoding and Routes APIs, and do one real low-value order end to end.

## Code structure

- `src/components/ui/` holds the building blocks. shadcn components (Button, Card, Field, Sheet…) are added with `npx shadcn@latest add <name>`. The generic pieces built on them live here too:
  - `ActionForm`: every form that calls a server action
  - `TextField` / `TextareaField` / `FileField` / `CheckboxField`, plus `FormMessage` and `SubmitButton`
  - `QuantityStepper`, `EmptyState`, `PageHeader`, `SectionHeader`, `Pager`, `ConfirmSubmitButton`
- `src/components/<area>/` holds the shop-specific pieces, built only from `ui/`. The areas are `layout`, `brand`, `product`, `cart`, `order`, `checkout`, `auth`, `forms`, `chat` and `admin`.
- `src/lib/site.ts` holds contact details and links; `src/lib/validation.ts` holds the phone/email rules and the safe-redirect check.
- Colours are theme tokens in `src/app/globals.css`: `primary` is navy and `brand` is magenta. Use `bg-primary`, `text-brand`, `variant="brand"` and so on, never raw hex values.

Before writing new markup, check whether a component already exists. If a pattern shows up a second time, move it into a shared component.

## Notes

- All money is stored in **kobo** (integers).
- The app reads and writes the database only through Prisma on the server. Row-level security is on for every table with no policies, so Supabase's public REST API can't read or change data using the publishable key.
- Prescription files live in a private bucket. Staff view them through signed links that expire after 10 minutes.
- Chat triage lives in `src/lib/chat/`: `triage.ts` has the emergency phrases (checked before the model, so they never depend on it) and the fixed handover messages; `assistant.ts` has the prompt and tools; `conversation.ts` handles storage, rate limits and handover. The model never writes what the customer is told when a chat is handed over.
- Old URLs (`/product/<id>`, `/category/<id>`, `/auth/login`, `/productType/…`) redirect to the new pages.
