# uptime-kuma-sentinel 🛸

Automatically pause and resume [Uptime Kuma](https://github.com/louislam/uptime-kuma) monitors when your internet connection fails. Built for monitoring services from locations with unreliable connectivity.

[![CI](https://github.com/jamiew/uptime-kuma-sentinel/actions/workflows/ci.yml/badge.svg)](https://github.com/jamiew/uptime-kuma-sentinel/actions/workflows/ci.yml)
[![Docker](https://github.com/jamiew/uptime-kuma-sentinel/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/jamiew/uptime-kuma-sentinel/actions/workflows/docker-publish.yml)
[![npm version](https://img.shields.io/npm/v/uptime-kuma-sentinel.svg)](https://www.npmjs.com/package/uptime-kuma-sentinel)

## The Problem

You're monitoring both local services and external sites with Uptime Kuma. When your internet connection drops at 3am, you suddenly get bombarded with alerts about "Google is down" and "GitHub is unreachable" - but they're not actually down, your ISP just had a hiccup. Meanwhile, your local services are fine but you can't tell through all the noise.

## The Solution

This sentinel watches a designated monitor that checks internet connectivity, like example.com, google.com, or Cloudflare DNS. When the internet connection fails, it automatically pauses all monitors in a specified group. When connectivity is restored, it resumes them. Your local service monitoring continues uninterrupted, and you avoid false alarms from temporary connectivity issues.

## Install

### Docker (Recommended)

```bash
docker run -d \
  --name uptime-kuma-sentinel \
  --restart unless-stopped \
  -e KUMA_URL=http://localhost:3001 \
  -e KUMA_USER=admin \
  -e KUMA_PASS=yourpassword \
  -e SENTINEL_NAME=INTERNET-SENTINEL \
  -e GROUP_TO_PAUSE=External \
  ghcr.io/jamiew/uptime-kuma-sentinel:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  sentinel:
    image: ghcr.io/jamiew/uptime-kuma-sentinel:latest
    container_name: uptime-kuma-sentinel
    restart: unless-stopped
    environment:
      KUMA_URL: http://uptime-kuma:3001
      KUMA_USER: admin
      KUMA_PASS: ${KUMA_PASS}
      SENTINEL_NAME: INTERNET-SENTINEL
      GROUP_TO_PAUSE: External
```

### npm

```bash
npm install -g uptime-kuma-sentinel
uptime-kuma-sentinel
```

### From Source

```bash
git clone https://github.com/jamiew/uptime-kuma-sentinel
cd uptime-kuma-sentinel
pnpm install && pnpm run build
pnpm start
```

## Setup

1. **Create a sentinel monitor** in Uptime Kuma
   - Name it something like `INTERNET-SENTINEL`
   - Monitor type: HTTP(s) or DNS
   - URL/Host: `https://example.com`, `https://google.com`, or DNS `1.1.1.1`
   - This monitor will detect when your internet connection fails

2. **Create a monitor group** for external services
   - Create a group called `External` (or any name you prefer)
   - Add all your external monitors to this group (GitHub, external APIs, cloud services, etc.)
   - Keep your local/internal monitors outside this group

3. **Configure and run the sentinel**
   - Set the environment variables (see Config below)
   - Run using Docker, npm, or from source
   - The sentinel will connect via WebSocket and watch for status changes

4. **Test it works**
   - Disconnect your internet briefly
   - Watch the logs - you should see the sentinel pause the external monitors
   - Reconnect - the monitors should resume automatically

## Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `KUMA_URL` | URL of your Uptime Kuma instance | `http://localhost:3001` |
| `KUMA_USER` | Uptime Kuma username | `admin` |
| `KUMA_PASS` | Uptime Kuma password | `changeme` |
| `SENTINEL_NAME` | Name of the monitor that checks internet connectivity | `INTERNET-SENTINEL` |
| `GROUP_TO_PAUSE` | Name of the group containing external monitors | `Sentinel` |

### Example Configuration

```bash
export KUMA_URL=http://localhost:3001
export KUMA_USER=admin
export KUMA_PASS=your-secure-password
export SENTINEL_NAME=INTERNET-SENTINEL
export GROUP_TO_PAUSE=External
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test           # Run tests in watch mode
pnpm test:ci        # Run tests once with coverage

# Code quality
pnpm run lint       # Lint code
pnpm run format     # Format code
pnpm run typecheck  # Check TypeScript types
pnpm run check      # Run all checks

# Build
pnpm run build      # Compile TypeScript to JavaScript
pnpm run dev        # Run in development mode with hot reload
```

## How It Works

1. Connects to Uptime Kuma via Socket.IO WebSocket
2. Authenticates using provided credentials
3. Listens for heartbeat events from the sentinel monitor
4. When the sentinel goes DOWN (internet lost):
   - Automatically pauses all monitors in the specified group
   - Prevents false alerts from external services
5. When the sentinel comes back UP (internet restored):
   - Resumes all previously paused monitors
   - Returns to normal monitoring

## Contributing

Pull requests are welcome! Feel free to:
- Add new features
- Improve error handling
- Add more configuration options
- Improve documentation

## License

MIT
