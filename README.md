# uptime-kuma-sentinel 🛸

Stops Uptime Kuma from freaking out when your internet dies. Built for spotty home connections.

**⚠️ WIP - Prone to breakage. PRs welcome (mention `@claude` for AI reviews).**

## The Problem

You're monitoring local services AND external sites. Internet drops at 3am. Suddenly you're getting 50 alerts about "Google is down" when really it's just your crappy ISP. Meanwhile your local services are fine but you can't tell through all the noise.

## The Solution

Watches a sentinel monitor (like Cloudflare DNS). When internet dies, auto-pauses all monitors in a specific group. When it's back, resumes them. Local services keep running. No false alarms.

## Install

### From Docker

**TODO: Docker images not published yet**

```bash
docker run -d \
  -e KUMA_URL=http://dubtron.local:3001 \
  -e KUMA_USER=admin \
  -e KUMA_PASS=yourpass \
  -e GROUP_TO_PAUSE=Sentinel \
  ghcr.io/jamiew/uptime-kuma-sentinel:latest
```

### From Source

```bash
git clone https://github.com/jamiew/uptime-kuma-sentinel
cd uptime-kuma-sentinel
pnpm install && pnpm run build
pnpm start
```

## Setup

1. Create sentinel monitor in Kuma (check 1.1.1.1:53 or google.com)
2. Create a group called "Sentinel" (or whatever) and add external monitors to it
3. Run this sentinel
4. Sleep better

## Config

```bash
KUMA_URL=http://dubtron.local:3001  # Your Kuma instance
KUMA_USER=admin                     # Username
KUMA_PASS=changeme                  # Password
SENTINEL_NAME=INTERNET-SENTINEL     # Monitor that checks internet
GROUP_TO_PAUSE=Sentinel             # Group containing external monitors
```

## Dev

```bash
pnpm test      # Tests
pnpm run check # Lint/format
pnpm run build # Compile
```

## License

MIT