# Qwik PWA Frontend

A Progressive Web App (PWA) frontend built with [Qwik](https://qwik.builder.io) for the ecommerce platform. Features Amazon-style UI, Zitadel authentication, GraphQL data fetching, and Matrix chat integration.

## Features

- 🚀 **Qwik Framework** - Resumable, instant-loading applications
- 🔐 **Zitadel Authentication** - OIDC-based login/signup with PKCE (or mock auth for development)
- 📦 **Payload CMS Integration** - GraphQL data fetching for products/variants
- 💬 **Matrix Chat** - Real-time chat for authenticated users
- 📱 **PWA Ready** - Installable, offline-capable progressive web app
- 🎨 **Amazon-Style UI** - Modern ecommerce design with teal header

## Prerequisites

- **Node.js** 18.17+ or 20.3+
- **pnpm** (package manager - matches backend)
- **Running Payload CMS Backend** (`ecom-payload-be`)
- **Zitadel Instance** (optional - can use mock auth for development)
- **Matrix Homeserver** (optional - for chat feature)

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables) below).

### 3. Start Development Server

```bash
pnpm dev
```

The app will be available at **http://localhost:5173**

## Environment Variables

Create a `.env` file in the `frontend` directory with the following variables:

### Required Variables

```env
# Payload CMS Backend (REQUIRED)
VITE_API_URL=http://localhost:3000
VITE_GRAPHQL_ENDPOINT=/api/shop-api/graphql
```

### Authentication Variables

```env
# Authentication Mode (REQUIRED)
# Set to "true" for mock auth (no Zitadel needed)
# Set to "false" for real Zitadel authentication
VITE_USE_MOCK_AUTH=true

# Zitadel OIDC Configuration (REQUIRED if VITE_USE_MOCK_AUTH=false)
VITE_ZITADEL_AUTHORITY=https://your-instance.zitadel.cloud
VITE_ZITADEL_CLIENT_ID=your-client-id
VITE_ZITADEL_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_ZITADEL_POST_LOGOUT_URI=http://localhost:5173
VITE_ZITADEL_SCOPE=openid profile email
```

### Optional Variables

```env
# Matrix Chat Configuration (OPTIONAL)
VITE_MATRIX_HOMESERVER_URL=https://matrix.org
VITE_MATRIX_DEFAULT_ROOM_ID=!your-room-id:matrix.org
```

### Environment Variable Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `VITE_API_URL` | ✅ Yes | Backend API URL | `http://localhost:3000` |
| `VITE_GRAPHQL_ENDPOINT` | ✅ Yes | GraphQL endpoint path | `/api/shop-api/graphql` |
| `VITE_USE_MOCK_AUTH` | ✅ Yes | Use mock authentication | `true` |
| `VITE_ZITADEL_AUTHORITY` | Conditional | Zitadel server URL | - |
| `VITE_ZITADEL_CLIENT_ID` | Conditional | Zitadel client ID | - |
| `VITE_ZITADEL_REDIRECT_URI` | Conditional | OAuth redirect URI | - |
| `VITE_ZITADEL_POST_LOGOUT_URI` | Conditional | Post-logout redirect | - |
| `VITE_ZITADEL_SCOPE` | Conditional | OAuth scopes | `openid profile email` |
| `VITE_MATRIX_HOMESERVER_URL` | ❌ No | Matrix server URL | `https://matrix.org` |
| `VITE_MATRIX_DEFAULT_ROOM_ID` | ❌ No | Default Matrix room ID | - |

## Authentication Setup

### Option 1: Mock Authentication (Development)

For quick development without setting up Zitadel:

1. Set `VITE_USE_MOCK_AUTH=true` in `.env`
2. Click "Sign In" - you'll be instantly logged in as "Demo User"
3. No additional setup required!

### Option 2: Zitadel Authentication (Production)

1. **Create Zitadel Application**:
   - Go to your Zitadel console
   - Create a new project
   - Add a new application (Web/SPA type)
   - Select **PKCE** authentication method
   - Set **Authentication Method** to **"none"** (for PKCE)

2. **Configure Redirect URIs**:
   - Add: `http://localhost:5173/auth/callback` (development)
   - Add: `https://your-domain.com/auth/callback` (production)

3. **Configure Post Logout URIs**:
   - Add: `http://localhost:5173` (development)
   - Add: `https://your-domain.com` (production)

4. **Configure CORS**:
   - Add: `http://localhost:5173` to Allowed Origins (development)
   - Add: `https://your-domain.com` to Allowed Origins (production)

5. **Update `.env`**:
   ```env
   VITE_USE_MOCK_AUTH=false
   VITE_ZITADEL_AUTHORITY=https://your-instance.zitadel.cloud
   VITE_ZITADEL_CLIENT_ID=your-client-id
   VITE_ZITADEL_REDIRECT_URI=http://localhost:5173/auth/callback
   VITE_ZITADEL_POST_LOGOUT_URI=http://localhost:5173
   VITE_ZITADEL_SCOPE=openid profile email
   ```

6. **Restart dev server**:
   ```bash
   pnpm dev
   ```

See `ZITADEL_SETUP.md` for detailed instructions.

## Project Structure

```
frontend/
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   ├── favicon.svg        # App icon
│   └── icons/             # PWA icons
├── src/
│   ├── components/
│   │   ├── product/       # Product components
│   │   └── router-head/  # Router head component
│   ├── routes/
│   │   ├── index.tsx      # Home page
│   │   ├── layout.tsx     # Root layout
│   │   ├── products/      # Product pages
│   │   ├── auth/          # Authentication pages
│   │   └── chat/          # Chat page
│   ├── services/
│   │   ├── auth/          # Zitadel authentication
│   │   ├── graphql/       # GraphQL client & queries
│   │   ├── matrix/        # Matrix chat service
│   │   └── config.ts      # App configuration
│   ├── utils/             # Utility functions
│   ├── global.css         # Global styles
│   └── root.tsx           # App root
├── .env.example           # Environment template
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm start` | Start with SSR mode |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm fmt` | Format with Prettier |

### Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173` with hot module replacement (HMR).

## Building for Production

### Build

```bash
pnpm build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
pnpm preview
```

This serves the production build locally for testing.

## GraphQL Integration

The frontend uses GraphQL to fetch data from the Payload CMS backend.

### Available Queries

- `search` - Search products with filters
- `product` - Get product by slug or ID
- `collections` - List all collections
- `collection` - Get collection by slug or ID

### Example Query

```typescript
import { productService } from '~/services/graphql'

// Get product by slug
const product = await productService.getProductBySlug('my-product')
```

## PWA Features

### Installation

The app can be installed on supported browsers/devices. An install prompt will appear when available.

### Offline Support

The service worker provides:
- **Static asset caching** - CSS, JS, images cached on install
- **Network-first strategy** - For API calls with cache fallback
- **Offline page** - Fallback page when completely offline

### Service Worker

The service worker is located at `public/sw.js` and is automatically registered on app load.

## Matrix Chat Setup

1. Set up a Matrix homeserver (or use matrix.org)
2. Create a room for the chat
3. Configure in `.env`:
   ```env
   VITE_MATRIX_HOMESERVER_URL=https://matrix.org
   VITE_MATRIX_DEFAULT_ROOM_ID=!your-room-id:matrix.org
   ```

The chat uses guest access by default for demo purposes. For production, configure proper Matrix authentication.

## Styling

The app uses vanilla CSS with CSS custom properties for theming. The design follows an Amazon-style ecommerce layout with:

- Teal/cyan header
- Orange accent colors
- Modern card-based product displays
- Responsive grid layouts

### Color Palette

```css
:root {
  --header-bg: #0f766e;        /* Teal header */
  --primary: #f97316;           /* Orange accents */
  --background: #ffffff;
  --text: #0f172a;
  --border: #e2e8f0;
}
```

## Troubleshooting

### Backend Connection Issues

If you see "Failed to load products" errors:

1. Make sure the backend is running: `cd ../ecom-payload-be && pnpm dev`
2. Check `VITE_API_URL` in `.env` matches your backend URL
3. Check `VITE_GRAPHQL_ENDPOINT` is `/api/shop-api/graphql`

### Authentication Issues

**Mock Auth Not Working**:
- Ensure `VITE_USE_MOCK_AUTH=true` in `.env`
- Restart the dev server

**Zitadel Auth Not Working**:
- Check redirect URI is configured in Zitadel
- Verify `VITE_ZITADEL_AUTHORITY` and `VITE_ZITADEL_CLIENT_ID` are correct
- Check browser console for errors
- Ensure CORS is configured in Zitadel

### GraphQL Errors

If you see GraphQL schema errors:
- Verify `VITE_GRAPHQL_ENDPOINT=/api/shop-api/graphql` (not `/api/graphql`)
- Check backend is running and accessible
- Check browser network tab for actual error messages

## Resources

- [Qwik Documentation](https://qwik.builder.io/docs)
- [Zitadel Documentation](https://zitadel.com/docs)
- [Matrix Documentation](https://matrix.org/docs)
- [Payload CMS GraphQL](https://payloadcms.com/docs/graphql/overview)

## License

MIT
