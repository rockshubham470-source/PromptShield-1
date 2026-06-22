# PromptShield Web Dashboard

Modern, responsive web dashboard for PromptShield enterprise platform built with React, TypeScript, and Tailwind CSS.

## Features

✨ **Dashboard** - Real-time detection metrics and trends
📊 **Analytics** - Comprehensive security analytics
🚨 **Detections** - View and filter injection detection events
🔑 **API Keys** - Manage API access tokens
📋 **Rules** - Configure and manage detection rules
⚙️ **Settings** - User and application settings
🔐 **Authentication** - Secure login/signup

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: Zustand
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Routing**: React Router

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
cd web-app
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Project Structure

```
web-app/
├── public/                  # Static files
├── src/
│   ├── components/         # Reusable components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Charts.tsx
│   ├── pages/             # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Detections.tsx
│   │   ├── Analytics.tsx
│   │   ├── ApiKeys.tsx
│   │   ├── Rules.tsx
│   │   ├── Settings.tsx
│   │   └── Login.tsx
│   ├── lib/               # Utilities & API
│   │   ├── api.ts        # Axios configuration
│   │   └── auth.ts       # Authentication state
│   ├── hooks/             # Custom hooks
│   │   └── useData.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Pages

### Dashboard
Overview of detection metrics, trends, and recent alerts.

**Features**:
- Real-time statistics cards
- Detection trend chart
- Risk distribution pie chart
- Recent detections table

### Detections
Comprehensive list of all injection detection events with filtering and search.

**Features**:
- Search and filter by pattern, user, risk level
- Export detection data
- View detailed detection information
- Real-time updates

### Analytics
Advanced analytics and insights into attack patterns and trends.

**Features**:
- Detection accuracy metrics
- False positive rates
- Performance statistics
- Top attack patterns

### API Keys
Manage API keys for programmatic access.

**Features**:
- Create/revoke API keys
- View key usage history
- Copy keys to clipboard
- API documentation

### Rules
Configure and manage detection rules.

**Features**:
- Enable/disable rules
- View rule performance
- Edit rule settings
- Add custom rules

### Settings
User account and application settings.

**Features**:
- Profile management
- Detection settings
- Notification preferences
- Password management
- Subscription info

### Login
Authentication page with signup support.

**Features**:
- Email/password login
- User registration
- Demo credentials
- Error handling

## API Integration

The dashboard connects to a backend API. Configure the API endpoint:

```typescript
// src/lib/api.ts
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
})
```

### Expected API Endpoints

```
GET    /auth/me                 - Get current user
POST   /auth/login              - Login
POST   /auth/signup             - Signup
GET    /stats                   - Dashboard statistics
GET    /detections              - List detections
GET    /analytics               - Analytics data
GET    /api-keys                - List API keys
POST   /api-keys                - Create API key
DELETE /api-keys/:id            - Delete API key
GET    /rules                   - List detection rules
POST   /rules                   - Create rule
PUT    /rules/:id               - Update rule
DELETE /rules/:id               - Delete rule
```

## Customization

### Theme

Edit `tailwind.config.js` to customize colors and styles.

### Components

Reusable components are in `src/components/`:
- `Chart` - Wrapper for chart components
- `TrendChart` - Line chart for trends
- `RiskDistributionChart` - Pie chart for risk distribution
- `BarChartComponent` - Bar chart for comparisons

### State Management

Use Zustand stores for global state:

```typescript
// src/lib/auth.ts
export const useAuthStore = create<AuthState>(...)
```

## Performance

- **Code Splitting**: Automatic with Vite
- **Lazy Loading**: Route-based code splitting
- **Caching**: API response caching with Zustand
- **Optimization**: Tailwind CSS purging

## Security

- **Authentication**: Token-based (JWT)
- **CORS**: Configured in Vite
- **HTTPS**: Use HTTPS in production
- **API Key**: Secure storage in localStorage

## Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy
```

### Docker

```dockerfile
FROM node:18 AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Environment Variables

```env
REACT_APP_API_URL=http://localhost:8000/api
```

## Testing

```bash
npm run test
```

## Linting

```bash
npm run lint
```

## Type Checking

```bash
npm run type-check
```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md)

## License

MIT - See [LICENSE](../LICENSE)

## Support

- Documentation: [docs/](../docs/)
- Issues: GitHub Issues
- Email: support@promptshield.io