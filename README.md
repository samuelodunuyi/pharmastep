# PharmaStep

An online pharmacy for Lagos, Nigeria. Customers buy genuine medicines and health products, checked by licensed pharmacists and delivered to their door.

## What customers can do

- **Shop** by category or search, and filter by form and by prescription or over-the-counter. Each product page shows its details and, where available, the directions and warnings from the pack.
- **Order** with an account or as a guest, and pay securely online by card, bank transfer or USSD. The delivery fee is worked out from the delivery address.
- **Buy prescription medicines** by uploading a prescription at checkout. A pharmacist checks it before the order is sent out; if it can't be approved, the order is refunded in full.
- **Track orders** on a timeline, with an email at each step.
- **Ask a pharmacist** in the in-app chat. An assistant helps with minor ailments, citing trusted health websites and suggesting suitable products we have in stock; anything more serious goes straight to a pharmacist, who takes over the chat. Past chats can be continued at any time. The chat is not for emergencies: call 112.

## For the pharmacy team

- Manage orders from payment to delivery, and post updates the customer sees.
- Review prescriptions before dispatch.
- Answer chats that need a pharmacist, most urgent first.
- Manage products, categories, pack directions and staff accounts.

## How it's built

**Stack:** Next.js 16 (App Router, React 19, TypeScript). Postgres database with built-in user sign-in and file storage, and Prisma 7 as the database layer. The UI is built with Tailwind CSS 4 and shadcn/ui. Payments go through Paystack, delivery distances come from Google Maps, and order emails go out through Resend.

**Architecture**
- **Server-rendered.** Pages render on the server, and changes go through server actions. The database is only ever reached from the server, never from the browser.
- **Payments.** An order is marked paid only after the server has confirmed the payment with Paystack and checked the amount matches.
- **Prescriptions.** Uploaded prescriptions are stored privately. Staff open them through links that expire after a few minutes.
- **Guest checkout.** Carts, orders and chats work without an account, and move over when the customer signs in.
- **Responsive.** Built for phones first, and works on tablets and desktops.

**A grounded pharmacist assistant**

The chat assistant runs on a large language model, but the model is one part of a controlled system. The system is designed so the assistant can only say what it can back up, and hands anything outside its limits to a pharmacist.
- **Triage in code comes first.** Messages describing a possible emergency go straight to a pharmacist, without being sent to the model, and the customer is told to call 112.
- **It only acts through set tools.** It can search the live catalogue, suggest products, or hand the chat to a pharmacist, and nothing else. Only in-stock, over-the-counter products it actually found can be suggested; the server discards anything else.
- **Health information comes from vetted sources.** Before advising, it searches a fixed list of trusted health websites. Each statement it cites is shown under the reply as a link to the exact page.
- **Dosing comes only from pharmacist-approved labels.** The assistant may quote directions from a product's approved pack label word for word. It never states a dose in its own words.
- **Every reply is checked before it's sent.** A reply is held back and the chat passed to a pharmacist if it contains a dose not quoted from an approved label, or names a prescription-only medicine.
- **Honest about what it is.** Every reply is labelled as automated and shows where its information came from. Anything the assistant can't handle safely goes to a pharmacist: moderate or severe symptoms, pregnancy, children, long-term conditions, or a refusal or error from the model. Messages to the customer at handover are fixed text, never written by the model.
- **Tested before any change.** A set of test conversations checks that the assistant still escalates and answers correctly before any change to its instructions or model. It covers mild cases, cases that must go to a pharmacist, emergencies, and attempts to get around the rules.
- **Usage is capped.** Per-customer rate limits and a daily limit keep costs under control.

**Data:** products, categories and pack labels; carts and orders, with a status timeline; prescriptions; and chat conversations. All money is stored in kobo.

**Security:** row-level security on every table, rate limiting on sign-in and other public forms, security headers, and uploads checked by their actual contents.

**Code layout**
- `src/app`: pages and server actions
- `src/components`: shared UI components, plus feature components grouped by area
- `src/lib`: business logic (orders, payments, chat, auth)
- `prisma`: the database schema and migrations
- `evals`: the assistant's test conversations
