# Ecommerce Platform - Full Stack

A complete ecommerce platform built with **Payload CMS** (backend) and **Qwik** (frontend PWA). Features include product management, shopping carts, orders, Stripe payments, Zitadel authentication, and Matrix chat.

## 🏗️ Architecture

This project consists of two main components:

- **Backend** (`eco-backend/`) - Payload CMS with GraphQL API
- **Frontend** (`frontend/`) - Qwik PWA with Amazon-style UI

```
.
├── eco-backend/     # Payload CMS Backend
│   ├── src/
│   │   ├── collections/     # Products, Users, Orders, etc.
│   │   ├── graphql-adapter/ # Custom GraphQL shop API
│   │   └── app/             # Next.js app router
│   └── README.md
│
├── frontend/            # Qwik PWA Frontend
│   ├── src/
│   │   ├── routes/          # Pages and routes
│   │   ├── services/        # Auth, GraphQL, Matrix
│   │   └── components/      # React components
│   └── README.md
│
└── README.md           # This file
```

## ✨ Features

### Backend Features
- 🛍️ **Product Management** - Products with variants, categories, facets
- 🛒 **Shopping Carts** - User and guest cart support
- 💳 **Stripe Payments** - Integrated payment processing
- 📦 **Orders & Transactions** - Complete order management
- 🔐 **User Authentication** - Admin and customer roles
- 📊 **GraphQL API** - Custom shop API with GraphQL
- 🎨 **Admin Panel** - Enterprise-grade admin UI
- 📝 **Content Management** - Pages, media, categories

### Frontend Features
- 🚀 **Qwik Framework** - Resumable, instant-loading applications
- 🔐 **Zitadel Authentication** - OIDC-based login/signup with PKCE
- 📦 **GraphQL Integration** - Fetch products/variants from Payload
- 💬 **Matrix Chat** - Real-time chat for authenticated users
- 📱 **PWA Ready** - Installable, offline-capable progressive web app
- 🎨 **Amazon-Style UI** - Modern ecommerce design

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.20.2+ or 20.9.0+
- **pnpm** (package manager)
- **SQLite** (included, no setup needed)
- **Stripe Account** (optional, for payments)
- **Zitadel Instance** (optional, can use mock auth)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd steven
```

### 2. Backend Setup

```bash
# Navigate to backend
cd eco-backend

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
pnpm dev
```

The backend will be available at:
- **Admin Panel**: http://localhost:3000/admin
- **GraphQL API**: http://localhost:3000/api/shop-api/graphql

**First Time Setup:**
1. Open http://localhost:3000/admin
2. Create your first admin user
3. (Optional) Seed the database with sample data

### 3. Frontend Setup

```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
pnpm dev
```

The frontend will be available at **http://localhost:5173**

## 📋 Environment Variables

### Backend Environment Variables

Create `eco-backend/.env`:

```env
# Required
PAYLOAD_SECRET=your-super-secret-key-here
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
QWIK_FRONTEND_URL=http://localhost:5173

# Optional (Stripe)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOKS_SIGNING_SECRET=whsec_...
```

See `eco-backend/.env.example` for complete details.

### Frontend Environment Variables

Create `frontend/.env`:

```env
# Required
VITE_API_URL=http://localhost:3000
VITE_GRAPHQL_ENDPOINT=/api/shop-api/graphql

# Authentication (choose one)
VITE_USE_MOCK_AUTH=true  # For development (no Zitadel needed)

# OR for production with Zitadel:
# VITE_USE_MOCK_AUTH=false
# VITE_ZITADEL_AUTHORITY=https://your-instance.zitadel.cloud
# VITE_ZITADEL_CLIENT_ID=your-client-id
# VITE_ZITADEL_REDIRECT_URI=http://localhost:5173/auth/callback
# VITE_ZITADEL_POST_LOGOUT_URI=http://localhost:5173
# VITE_ZITADEL_SCOPE=openid profile email
```

See `frontend/.env.example` for complete details.

## 🛠️ Development

### Running Both Services

You need to run both backend and frontend simultaneously:

**Terminal 1 - Backend:**
```bash
cd eco-backend
pnpm dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm dev
```

### Available Scripts

#### Backend (`eco-backend/`)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run all tests |
| `pnpm lint` | Run ESLint |

#### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |

## 🔗 Integration

### GraphQL API

The frontend connects to the backend via GraphQL:

- **Backend GraphQL Endpoint**: `http://localhost:3000/api/shop-api/graphql`
- **Frontend Config**: Set `VITE_GRAPHQL_ENDPOINT=/api/shop-api/graphql` in `frontend/.env`

### CORS Configuration

The backend is configured to allow requests from the frontend. Ensure `QWIK_FRONTEND_URL` in `eco-backend/.env` matches your frontend URL.

### Authentication Flow

1. **Mock Auth (Development)**: 
   - Set `VITE_USE_MOCK_AUTH=true` in `frontend/.env`
   - No external services needed

2. **Zitadel Auth (Production)**:
   - Set `VITE_USE_MOCK_AUTH=false` in `frontend/.env`
   - Configure Zitadel application
   - See `frontend/ZITADEL_SETUP.md` for details

## 📦 Database

The backend uses **SQLite** by default:

- **Development**: Local file (`eco-backend/database.db`)
- **Production**: Cloudflare D1 (SQLite-based)

No additional database setup required! The database file is created automatically on first run.

## 🧪 Testing

### Backend Tests

```bash
cd eco-backend
pnpm test:int      # Integration tests
pnpm test:e2e      # E2E tests with Playwright
pnpm test          # Run all tests
```

### Frontend Tests

```bash
cd frontend
pnpm test          # Run tests (if configured)
```

## 🚀 Production Deployment

### Backend Deployment

1. Set production environment variables
2. Build the application:
   ```bash
   cd eco-backend
   pnpm build
   ```
3. Start production server:
   ```bash
   pnpm start
   ```

### Frontend Deployment

1. Set production environment variables
2. Build the application:
   ```bash
   cd frontend
   pnpm build
   ```
3. Deploy the `dist/` directory to your hosting provider

### Environment Variables for Production

**Backend:**
- `PAYLOAD_SECRET` - Strong, random secret
- `NEXT_PUBLIC_SERVER_URL` - Production backend URL
- `QWIK_FRONTEND_URL` - Production frontend URL
- `NODE_ENV=production`

**Frontend:**
- `VITE_API_URL` - Production backend URL
- `VITE_GRAPHQL_ENDPOINT` - GraphQL endpoint path
- `VITE_USE_MOCK_AUTH=false` - Use real Zitadel
- Zitadel credentials

## 📚 Documentation

- **Backend README**: [`eco-backend/README.md`](eco-backend/README.md)
- **Frontend README**: [`frontend/README.md`](frontend/README.md)
- **Backend Environment Setup**: [`eco-backend/.env.example`](eco-backend/.env.example)
- **Zitadel Setup**: [`frontend/ZITADEL_SETUP.md`](frontend/ZITADEL_SETUP.md)

## 🛍️ Ecommerce Features

### Products & Variants
- Create products with multiple variants
- Set prices per variant
- Manage inventory
- Product categories and facets

### Shopping Cart
- Add products to cart
- Guest cart support
- User cart persistence
- Quantity management

### Checkout & Payments
- Stripe payment integration
- Order management
- Transaction tracking
- Guest checkout support

### User Accounts
- Customer accounts
- Order history
- Address management
- Profile management

## 🔐 Authentication

### Development (Mock Auth)
- No external services needed
- Instant login as "Demo User"
- Perfect for local development

### Production (Zitadel)
- OIDC-based authentication
- PKCE flow for security
- User management via Zitadel
- Link Zitadel users to Payload users

## 💬 Chat Feature

Matrix chat integration for authenticated users:
- Real-time messaging
- Guest access support
- Configurable homeserver
- Room-based chat

## 🎨 UI/UX

- **Amazon-style design** - Modern ecommerce layout
- **Teal header** - Distinctive branding
- **Responsive design** - Mobile-first approach
- **PWA capabilities** - Installable and offline-ready
- **Fast loading** - Qwik's resumable architecture

## 🐛 Troubleshooting

### Backend Not Starting
- Check Node.js version (18.20.2+ or 20.9.0+)
- Verify `PAYLOAD_SECRET` is set in `.env`
- Check port 3000 is available
- Review backend logs for errors

### Frontend Can't Connect to Backend
- Verify backend is running on port 3000
- Check `VITE_API_URL` in `frontend/.env`
- Verify `VITE_GRAPHQL_ENDPOINT` is `/api/shop-api/graphql`
- Check CORS configuration in backend

### Authentication Issues
- **Mock Auth**: Ensure `VITE_USE_MOCK_AUTH=true`
- **Zitadel**: Check redirect URIs are configured
- Verify Zitadel credentials in `.env`
- Check browser console for errors

### GraphQL Errors
- Verify GraphQL endpoint is `/api/shop-api/graphql` (not `/api/graphql`)
- Check backend is running
- Review network tab in browser DevTools

## 📦 Package Managers

Both projects use **pnpm** for consistency:

```bash
# Install pnpm globally
npm install -g pnpm

# Backend
cd eco-backend
pnpm install

# Frontend
cd frontend
pnpm install
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT

## 🔗 Resources

- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Qwik Documentation](https://qwik.builder.io/docs)
- [Zitadel Documentation](https://zitadel.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Matrix Documentation](https://matrix.org/docs)

## 📞 Support

For issues and questions:
- Check the individual README files in `eco-backend/` and `frontend/`
- Review troubleshooting sections
- Check documentation links above

---

**Happy coding! 🚀**

