# WebRTC Multicast Streaming Dashboard

Professional Laravel + Vue 3 web application for multicast streaming via WebRTC. Stream to multiple platforms simultaneously (YouTube, Twitch, Facebook Live) with a modern, intuitive interface.

## Features

### Core Functionality
- **WebRTC Sender**: Browser-based media capture and streaming
- **PeerJS Integration**: Automatic signaling with backend bridge
- **HD Normalization**: All video normalized to 1920x1080 @ 30fps
- **Multicast Streaming**: Stream to unlimited destinations simultaneously
- **URL Management**: Checkbox selection, inline editing, localStorage persistence
- **Screen Capture**: Switch between camera and screen sharing on-the-fly
- **Live Preview**: Real-time video preview with controls
- **Device Selection**: Choose camera and microphone
- **Progressive Web App (PWA)**: Installable with offline support

### UI/UX
- **Modern Design**: shadcn-vue components with Tailwind CSS v4
- **Dark Mode**: Automatic theme with cookie persistence
- **Real-time Status**: Connection state, recording status, track count
- **Persistent Storage**: URLs and settings saved in localStorage
- **Responsive Layout**: Works on desktop and tablet

### Authentication
- **Laravel Fortify**: Registration, login, password reset
- **Email Verification**: Optional account verification
- **2FA Support**: Time-based one-time passwords
- **Profile Management**: Update name, email, password

## Tech Stack

### Backend
- **Laravel 12** (PHP 8.2+)
- **Inertia.js SSR** (Server-side rendering)
- **Laravel Fortify** (Authentication)
- **Laravel Sanctum** (API tokens)
- **Laravel Wayfinder** (Type-safe routes)

### Frontend
- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **shadcn-vue** (new-york-v4 components)
- **PeerJS 1.5.5** for WebRTC signaling
- **lucide-vue-next** for icons

### Development
- **Vite** for fast builds
- **Pest PHP** for backend testing
- **Laravel Sail** (Docker environment)

## Quick Start

### Prerequisites
- PHP 8.2+ with extensions: mbstring, xml, curl, zip, sqlite
- Node.js 20.19+ or 22.12+
- Composer 2.x
- Docker Desktop (for Sail)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd webrtc-multicast

# Install PHP dependencies
composer install

# Install Node dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Run database migrations
php artisan migrate

# Generate PWA icons (optional but recommended)
./generate-pwa-icons.sh
# Or manually add pwa-192x192.png and pwa-512x512.png to public/

# Build frontend assets
npm run build
```

### Development

```bash
# Complete setup (first time)
composer run setup

# Start full dev environment (recommended)
composer run dev
# Runs: PHP server + queue worker + logs + Vite

# Start with SSR
composer run dev:ssr

# Frontend only
npm run dev

# Run tests
composer run test
```

### Using Laravel Sail (Docker)

```bash
# Start Sail environment
./vendor/bin/sail up -d

# Run artisan commands
./vendor/bin/sail artisan migrate

# Install packages
./vendor/bin/sail composer require package/name
./vendor/bin/sail npm install package-name

# Build frontend
./vendor/bin/sail npm run build
```

## Usage

### 1. Start Backend Bridge

In a separate terminal, start the Python WebRTC bridge:

```bash
cd /path/to/webrtc-rtmp
python3.11 main.py --peerjs
```

**Output:**
```
Connected! Your Peer ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 2. Access Dashboard

1. Open browser: http://localhost
2. Register/Login
3. Navigate to Dashboard

### 3. Connect to Backend

1. Paste Peer ID from backend into connection field
2. Click "Connect"
3. Allow camera/microphone permissions
4. Video preview should appear

### 4. Add Streaming Destinations

**Twitch:**
```
rtmp://live.twitch.tv/app/YOUR_STREAM_KEY
```

**YouTube:**
```
rtmp://a.rtmp.youtube.com/live2/YOUR_STREAM_KEY
```

**Facebook Live (requires Docker with stunnel):**
```
rtmp://nginx-rtmp:1935/facebook/FB-YOUR-STREAM-KEY
```

Or direct port 80:
```
rtmp://live-api-s.facebook.com:80/rtmp/FB-YOUR-STREAM-KEY
```

### 5. Start Broadcasting

1. Check desired destinations (✓)
2. Click "Start Broadcast (N)" where N = enabled count
3. Monitor status in UI
4. Click "Stop Broadcast" to end

## Features Deep Dive

### HD Video Normalization

All video (camera and screen) is automatically normalized to HD:
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30 fps (consistent)
- **Aspect Ratio**: Preserved with letterboxing
- **Benefits**: Predictable bandwidth, consistent quality

The normalization uses canvas rendering for real-time processing.

### URL Management

- **Add**: Type URL and press Enter or click +
- **Enable/Disable**: Click checkbox to include in broadcast
- **Edit**: Click pencil icon, modify URL, save
- **Delete**: Click trash icon
- **Persistence**: All URLs and states saved in localStorage

### Screen Capture

Click "Screen Share" button:
- Select entire screen, window, or browser tab
- Includes system audio (if available)
- Automatically replaces camera tracks
- Switch back to camera anytime

### Device Selection

Dropdown menus for:
- Video input (cameras, capture cards)
- Audio input (microphones, line-in)
- Changes apply when switching stream

## Configuration

### Environment Variables

```env
APP_URL=http://localhost
APP_PORT=80

VITE_PORT=5173
VITE_HOST=localhost

DB_CONNECTION=sqlite
# Or use MySQL/PostgreSQL

SESSION_DRIVER=file
QUEUE_CONNECTION=sync
```

### Inertia SSR

SSR is enabled by default (port 13714):

```php
// config/inertia.php
'ssr' => [
    'enabled' => true,
    'url' => 'http://127.0.0.1:13714/render',
],
```

### Tailwind Configuration

Configured via `@tailwindcss/vite` plugin. Custom colors and theme in `resources/css/app.css`.

## Project Structure

```
webrtc-multicast/
├── app/
│   ├── Actions/Fortify/          # Auth actions
│   ├── Http/Controllers/         # Laravel controllers
│   └── Models/                   # Eloquent models
├── resources/
│   ├── js/
│   │   ├── components/           # Vue components
│   │   │   └── ui/              # shadcn-vue (auto-generated)
│   │   ├── composables/         # Vue composables (usePeerJS)
│   │   ├── layouts/             # Page layouts
│   │   ├── pages/               # Inertia pages
│   │   │   └── Dashboard.vue   # Main streaming interface
│   │   ├── types/               # TypeScript definitions
│   │   ├── app.ts               # Vue app entry
│   │   └── ssr.ts               # SSR entry
│   ├── css/                     # Tailwind styles
│   └── views/                   # Blade templates
├── routes/
│   ├── web.php                  # Main routes
│   ├── api.php                  # API routes (Sanctum)
│   └── settings.php             # Settings routes
├── tests/
│   ├── Feature/                 # Feature tests (Pest)
│   └── Unit/                    # Unit tests
├── composer.json                # PHP dependencies
├── package.json                 # Node dependencies
├── vite.config.ts               # Vite configuration
└── tsconfig.json                # TypeScript config
```

## Testing

### Backend Tests (Pest PHP)

```bash
# All tests
php artisan test

# Specific file
php artisan test tests/Feature/Auth/AuthenticationTest.php

# With coverage
php artisan test --coverage
```

### Frontend Linting

```bash
# Check and fix
npm run lint

# Format code
npm run format

# Check format only
npm run format:check
```

## Deployment

### Build for Production

```bash
# Frontend assets
npm run build

# With SSR
npm run build:ssr

# Optimize Laravel
php artisan optimize
php artisan route:cache
php artisan view:cache
```

### Environment Setup

1. Set `APP_ENV=production`
2. Set `APP_DEBUG=false`
3. Configure database credentials
4. Set up queue worker: `php artisan queue:work`
5. Configure web server (Nginx/Apache)

## Troubleshooting

### "No Peer ID" Error
Backend bridge must be running first. Check Python terminal for Peer ID.

### Connection Refused
Ensure backend bridge is accessible. If using Docker, check network configuration.

### No Video Preview
Check browser permissions for camera/microphone. Click lock icon in address bar.

### SSR Build Errors
Ensure Node.js version is 20.19+ or 22.12+. Check with: `node --version`

### Sail Port Conflicts
Edit `.env` and change `APP_PORT`, `VITE_PORT`, or `DB_PORT` if in use.

### PWA Not Installing
Ensure PWA icons exist. See [PWA Setup Guide](PWA_SETUP.md) for details.

## Documentation

- **[PWA Setup Guide](PWA_SETUP.md)** - Progressive Web App configuration and features
- **[PWA Icon Guide](public/PWA_ICONS_README.md)** - Generate required PWA icons

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature-name`
3. Run tests: `composer run test`
4. Commit changes: `git commit -am 'Add feature'`
5. Push branch: `git push origin feature-name`
6. Open Pull Request

## License

[Add your license here]

## Credits

Built with:
- [Laravel](https://laravel.com)
- [Vue.js](https://vuejs.org)
- [Inertia.js](https://inertiajs.com)
- [shadcn-vue](https://shadcn-vue.com)
- [PeerJS](https://peerjs.com)
- [Tailwind CSS](https://tailwindcss.com)
