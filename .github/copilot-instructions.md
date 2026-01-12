# AI Coding Agent Instructions

## Architecture Overview

This is a **Laravel 12 + Vue 3 + Inertia.js + TypeScript** full-stack application with SSR support.

### Stack Components
- **Backend**: Laravel 12 (PHP 8.2+) with Laravel Fortify for authentication
- **Frontend**: Vue 3 + TypeScript + Inertia.js (SSR enabled)
- **Styling**: Tailwind CSS v4 with shadcn-vue components (new-york-v4 style)
- **Routing**: Laravel Wayfinder for type-safe routes
- **Testing**: Pest PHP for backend tests
- **Dev Environment**: Laravel Sail (Docker) or local PHP server

## Critical Workflows

### Development Commands
```bash
# Complete setup (first time)
composer run setup

# Start full dev environment (recommended)
composer run dev
# Runs: PHP server + queue worker + logs + Vite concurrently

# Start with SSR
composer run dev:ssr

# Frontend only
npm run dev

# Run tests
composer run test
# or: php artisan test
```

### Docker/Sail Usage
- Configuration: [compose.yaml](compose.yaml) uses PHP 8.5 container
- If using Sail, prefix commands with `./vendor/bin/sail`
- Ports: APP_PORT (80), VITE_PORT (5173), DB_PORT (3306)

## Code Conventions & Patterns

### Frontend Architecture

#### File Organization
- **Pages**: `resources/js/pages/**/*.vue` - Inertia page components
- **Layouts**: `resources/js/layouts/` - Persistent layouts (AppLayout, AuthLayout)
  - `AppLayout.vue` wraps `app/AppSidebarLayout.vue` and accepts breadcrumbs
- **Components**: `resources/js/components/` - Reusable components
  - `ui/` subdirectory contains auto-generated shadcn-vue components (DO NOT manually edit)
- **Composables**: `resources/js/composables/` - Vue composables (e.g., `useAppearance.ts`)
- **Types**: `resources/js/types/` - TypeScript type definitions

#### Import Aliases (tsconfig.json paths)
```typescript
import Component from '@/components/MyComponent.vue';
import { useAppearance } from '@/composables/useAppearance';
import { cn } from '@/lib/utils';
```

#### Inertia.js Conventions
- Pages auto-resolve from `resources/js/pages/` using dot notation
- Example: `Inertia::render('settings/Profile')` → `resources/js/pages/settings/Profile.vue`
- Props passed from controller are typed in page component `defineProps<Props>()`
- SSR is enabled at [config/inertia.php](config/inertia.php) (port 13714)

#### Styling Patterns
- Tailwind CSS v4 configured via `@tailwindcss/vite` plugin
- Use `cn()` utility from [resources/js/lib/utils.ts](resources/js/lib/utils.ts) for conditional classes
- Dark mode: Managed via `useAppearance` composable with cookie persistence
- Theme initialization: `initializeTheme()` called in [resources/js/app.ts](resources/js/app.ts)

### Backend Architecture

#### Route Organization
- [routes/web.php](routes/web.php) - Main routes (home, dashboard)
- [routes/settings.php](routes/settings.php) - Settings-related routes (required by web.php)
- Settings routes are namespaced: `/settings/profile`, `/settings/password`, etc.

#### Authentication with Fortify
- Configuration: [config/fortify.php](config/fortify.php)
- Enabled features: registration, password reset, email verification, 2FA
- Home path after auth: `/dashboard`
- Username field: `email` (lowercased)
- Controllers: `App\Http\Controllers\Settings\*` handle settings pages

#### Controller Patterns
- Use Inertia response: `return Inertia::render('PageName', [...]);`
- Middleware applied at route level or in route groups
- Common middleware: `auth`, `verified`, `throttle:6,1` (rate limiting)

### Component Development

#### shadcn-vue Components
- Managed via [components.json](components.json)
- Install new components: Use shadcn-vue CLI (see https://shadcn-vue.com)
- Components auto-import to `resources/js/components/ui/`
- Style: `new-york-v4`, Base color: `neutral`, CSS variables enabled

#### Custom Components
- Store in `resources/js/components/` (NOT in `ui/` subdirectory)
- Follow PascalCase naming convention
- Multi-word component names NOT enforced (ESLint rule disabled)
- Use `<script setup lang="ts">` syntax with TypeScript

### Code Quality

#### Linting & Formatting
```bash
npm run lint          # ESLint with auto-fix
npm run format        # Prettier format
npm run format:check  # Check formatting without changes
```

#### ESLint Configuration ([eslint.config.js](eslint.config.js))
- Vue 3 + TypeScript rules enabled
- Ignores: `vendor/`, `node_modules/`, `public/`, `bootstrap/ssr/`, `resources/js/components/ui/*`
- Disabled rules: `vue/multi-word-component-names`, `@typescript-eslint/no-explicit-any`

#### PHP Code Style
- Use Laravel Pint: `./vendor/bin/pint`
- PSR-12 compliant with Laravel conventions

## Testing

### Pest PHP
- Configuration: [tests/Pest.php](tests/Pest.php)
- Test organization: `tests/Feature/` and `tests/Unit/`
- Database refresh commented out by default - enable if needed
- Run tests: `composer run test` or `php artisan test`

## Important Notes

### Laravel Wayfinder
- Provides type-safe routing between backend and frontend
- Vite plugin configured in [vite.config.ts](vite.config.ts) with `formVariants: true`
- Auto-generates TypeScript route helpers

### SSR Considerations
- SSR enabled by default in [config/inertia.php](config/inertia.php)
- Entry point: [resources/js/ssr.ts](resources/js/ssr.ts)
- Build for SSR: `npm run build:ssr`
- Check for `typeof window === 'undefined'` when accessing browser APIs

### Database
- Default: MySQL 8.4 via Docker
- Migrations in `database/migrations/`
- Includes 2FA columns migration for Fortify

### Environment Setup
- Copy `.env.example` to `.env` if missing
- Key generation: `php artisan key:generate`
- Database setup: `php artisan migrate`

## Anti-Patterns to Avoid

- ❌ Don't manually edit files in `resources/js/components/ui/` (shadcn-vue managed)
- ❌ Don't use inline styles; use Tailwind utility classes
- ❌ Don't forget middleware on authenticated routes
- ❌ Don't access `window` or `document` without SSR checks
- ❌ Don't import Vue components without proper TypeScript types
