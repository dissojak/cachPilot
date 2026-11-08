# CashPilot

CashPilot helps a small business track real cash, forecast cash at 30/60/90 days, simulate decisions, and control expenses.

## Stack

- Next.js App Router
- React
- TypeScript
- pnpm + Turborepo
- MongoDB Atlas
- Mongoose
- Auth.js (OAuth)
- Vitest
- Playwright

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Fill `.env`:

- `DATABASE_URL`: MongoDB Atlas connection string
- `AUTH_SECRET`: long random secret
- `AUTH_URL`: app URL, e.g. `http://localhost:3000`
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`: Google OAuth credentials
- Optional: Cloudinary, Resend, Axiom

4. Run the app:

```bash
pnpm dev
```

Open `http://localhost:3000`.

### Google OAuth redirect URIs

Add these "Authorized redirect URIs" to the Google OAuth client (Google Cloud Console → Credentials):

- Dev: `http://localhost:3000/api/auth/callback/google`
- Production: `https://<your-domain>/api/auth/callback/google`

## Demo accounts

OAuth sign-in creates the user on first login. The seeded demo company is `Atlas Studio`.

## Checks

```bash
pnpm turbo run lint typecheck test build
```

## Tests

```bash
pnpm turbo run test
```

## Deployment

Deploy `apps/web` to Vercel with root directory `apps/web`. Configure production environment variables and MongoDB Atlas access.

## External resources

- Auth.js
- MongoDB Atlas
- Cloudinary
- Resend
- Axiom
- shadcn/ui
- Tailwind CSS

AI tools and external resources are declared here as required by the course.
