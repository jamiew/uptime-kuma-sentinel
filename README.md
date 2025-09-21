# uptime-kuma-sentinel 🛸

your uptime kuma's bodyguard. automatically pauses monitors when the internet dies so you don't get flooded with false alerts at 3am.

## what it does

watches a sentinel monitor (like cloudflare dns). when it drops, pauses all your tagged monitors. when it's back, unpauses them. simple as that.

## quick setup

```bash
# install & build
npm install && npm run build

# set your stuff
export KUMA_URL=http://localhost:3001
export KUMA_USER=admin
export KUMA_PASS=yourpass

# run it
npm start

# or docker
docker compose up -d
```

## config

```bash
KUMA_URL=http://localhost:3001      # kuma instance
KUMA_USER=admin                     # username
KUMA_PASS=changeme                  # password
SENTINEL_NAME=INTERNET-SENTINEL     # monitor to watch
TAG_TO_SUPPRESS=internet-dependent  # tag for dependent monitors
```

## dev

```bash
npm test      # run tests
npm run check # lint/format
npm run build # compile ts
```

## ci/cd

github actions handles everything:
- tests & builds on PRs
- multi-arch docker images
- auto-publishes to ghcr.io
- claude reviews your code

## how it works

connects via websocket to kuma's internal api. listens for heartbeats from sentinel. pauses/resumes monitors based on status. that's it.

## license

MIT