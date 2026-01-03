# Ecommerce Payload CMS Backend

A full-featured ecommerce backend built with [Payload CMS](https://payloadcms.com), featuring products, variants, carts, orders, and Stripe payment integration.

## Features

- 🛍️ **Products & Variants** - Full product management with variants
- 🛒 **Shopping Carts** - User and guest cart support
- 💳 **Stripe Payments** - Integrated payment processing
- 📦 **Orders & Transactions** - Complete order management
- 🔐 **User Authentication** - Admin and customer roles
- 📊 **GraphQL API** - Custom shop API with GraphQL
- 🎨 **Admin Panel** - Beautiful, enterprise-grade admin UI
- 📝 **Content Management** - Pages, media, categories
- 🔍 **Search & Filters** - Product search with faceted filtering

## Prerequisites

- **Node.js** 18.20.2+ or 20.9.0+
- **pnpm** (package manager)
- **SQLite** (default database, included)
- **Stripe Account** (optional, for payments)

## Quick Start

### 1. Install Dependencies

```bash
cd ecom-payload-be
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables) below).

### 3. Start Development Server

```bash
pnpm dev
```

The backend will be available at:
- **Admin Panel**: http://localhost:3000/admin
- **API**: http://localhost:3000/api
- **GraphQL Playground**: http://localhost:3000/api/graphql-playground
- **Shop GraphQL API**: http://localhost:3000/api/shop-api/graphql

### 4. Create First Admin User

1. Open http://localhost:3000/admin
2. Follow the on-screen instructions to create your first admin user
3. You can now access the admin panel and manage your store

## Environment Variables

Create a `.env` file in the `ecom-payload-be` directory with the following variables:

### Required Variables

```env
# Payload CMS Secret (REQUIRED)
# Generate a random string: openssl rand -base64 32
PAYLOAD_SECRET=your-super-secret-key-here

# Server URL (REQUIRED)
# Your backend server URL
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Frontend URL (REQUIRED)
# Your Qwik frontend URL for CORS and preview
QWIK_FRONTEND_URL=http://localhost:5173
```

### Optional Variables

```env
# Stripe Payment Configuration (OPTIONAL)
# Get these from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOKS_SIGNING_SECRET=whsec_...

# Preview Secret (OPTIONAL)
# For draft preview functionality
PREVIEW_SECRET=your-preview-secret

# Frontend URL (Alternative)
# Used if QWIK_FRONTEND_URL is not set
FRONTEND_URL=http://localhost:5173

# Vercel Deployment (OPTIONAL)
# Automatically set by Vercel
VERCEL_PROJECT_PRODUCTION_URL=your-project.vercel.app
NEXT_PUBLIC_VERCEL_URL=your-project.vercel.app
```

### Environment Variable Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `PAYLOAD_SECRET` | ✅ Yes | Secret key for Payload CMS encryption | - |
| `NEXT_PUBLIC_SERVER_URL` | ✅ Yes | Backend server URL | `http://localhost:3000` |
| `QWIK_FRONTEND_URL` | ✅ Yes | Frontend URL for CORS | `http://localhost:8080` |
| `STRIPE_SECRET_KEY` | ❌ No | Stripe secret key for payments | - |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ No | Stripe publishable key | - |
| `STRIPE_WEBHOOKS_SIGNING_SECRET` | ❌ No | Stripe webhook signing secret | - |
| `PREVIEW_SECRET` | ❌ No | Secret for draft preview | - |
| `FRONTEND_URL` | ❌ No | Alternative frontend URL | - |

## Database

This project uses **SQLite** by default:

- **Development**: Local SQLite file (`database.db`)
- **Production**: Cloudflare D1 (SQLite-based)

The database file is automatically created on first run. No additional setup required!

### Database Location

- Development: `ecom-payload-be/database.db`
- The database file is gitignored and should not be committed

## Project Structure

```
ecom-payload-be/
├── src/
│   ├── collections/          # Payload collections (Products, Users, etc.)
│   ├── graphql-adapter/     # Custom GraphQL shop API
│   ├── plugins/             # Payload plugins configuration
│   ├── components/          # React components
│   ├── app/                 # Next.js app router
│   │   ├── (app)/          # Frontend pages
│   │   └── (payload)/      # Payload admin & API
│   └── payload.config.ts   # Payload CMS configuration
├── .env.example            # Environment variables template
├── package.json
└── README.md
```

## API Endpoints

### REST API

- `GET /api/products` - List products
- `GET /api/products/:id` - Get product by ID
- `POST /api/users` - Create user
- `POST /api/users/login` - Login
- `POST /api/users/logout` - Logout
- `GET /api/users/me` - Get current user

### GraphQL API

- **Default GraphQL**: `/api/graphql` (Payload's built-in GraphQL)
- **Shop GraphQL API**: `/api/shop-api/graphql` (Custom shop API)

#### Shop GraphQL Queries

```graphql
# Search products
query SearchProducts($input: SearchInput!) {
  search(input: $input) {
    items {
      id
      title
      slug
      price {
        value
        currency
      }
      variants {
        id
        title
        price {
          value
          currency
        }
      }
    }
  }
}

# Get single product
query GetProduct($slug: String!) {
  product(slug: $slug) {
    id
    title
    description
    price {
      value
      currency
    }
    variants {
      id
      title
      price {
        value
        currency
      }
    }
  }
}
```

## Seeding the Database

To populate the database with sample data:

1. Go to http://localhost:3000/admin
2. Click "Seed Database" button in the dashboard
3. Or use the API endpoint: `POST /api/seed-shop`

**⚠️ Warning**: Seeding will **delete all existing data** and replace it with sample data.

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint errors |
| `pnpm test` | Run all tests |
| `pnpm test:int` | Run integration tests |
| `pnpm test:e2e` | Run E2E tests with Playwright |
| `pnpm generate:types` | Generate TypeScript types |

### Running Tests

```bash
# Run integration tests
pnpm test:int

# Run E2E tests
pnpm test:e2e

# Run all tests
pnpm test
```

## Production

### Build for Production

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Environment Variables for Production

Make sure to set these in your production environment:

- `PAYLOAD_SECRET` - Use a strong, random secret
- `NEXT_PUBLIC_SERVER_URL` - Your production backend URL
- `QWIK_FRONTEND_URL` - Your production frontend URL
- `NODE_ENV=production` - Set automatically by most platforms

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from https://dashboard.stripe.com/apikeys
3. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
4. Set up webhooks:
   ```bash
   pnpm stripe-webhooks
   ```
   This forwards Stripe webhooks to `http://localhost:3000/api/stripe/webhooks`

## CORS Configuration

The backend is configured to allow requests from your frontend. Update `QWIK_FRONTEND_URL` in `.env` to match your frontend URL.

CORS is configured in `src/payload.config.ts`:

```typescript
cors: [QWIK_FRONTEND_URL]
```

## Troubleshooting

### Database Issues

If you encounter database errors:

1. Delete `database.db` file
2. Restart the server
3. The database will be recreated automatically

### Port Already in Use

If port 3000 is already in use:

1. Change the port in `package.json` scripts
2. Or set `PORT` environment variable:
   ```bash
   PORT=3001 pnpm dev
   ```

### Type Generation

If TypeScript types are out of sync:

```bash
pnpm generate:types
```

## Resources

- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Payload Ecommerce Plugin](https://payloadcms.com/docs/ecommerce/plugin)
- [GraphQL Documentation](https://payloadcms.com/docs/graphql/overview)
- [Stripe Documentation](https://stripe.com/docs)

## License

MIT
