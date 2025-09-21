# uptime-kuma-sentinel 🛸

stops uptime kuma from freaking out when your internet dies. built for spotty home connections.

## the problem

you're monitoring local services AND external sites. internet drops at 3am. suddenly you're getting 50 alerts about "google is down" when really it's just your crappy ISP. meanwhile your local services are fine but you can't tell through all the noise.

## the solution

this watches a sentinel monitor (like cloudflare dns). when internet dies, it auto-pauses all monitors tagged "internet-dependent". when internet's back, it resumes them. your local service monitors keep running. no false alarms. sleep preserved.

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
KUMA_URL=http://localhost:3001      # your kuma instance
KUMA_USER=admin                     # username
KUMA_PASS=changeme                  # password
SENTINEL_NAME=INTERNET-SENTINEL     # monitor that checks internet
TAG_TO_SUPPRESS=internet-dependent  # tag for external monitors
```

## how to use

1. create a sentinel monitor in kuma that checks something super reliable (1.1.1.1:53, google.com, etc)
2. tag all your external/internet monitors with "internet-dependent"
3. run this sentinel
4. when internet dies, tagged monitors pause automatically
5. when internet returns, they resume

local services stay monitored. external services don't false alarm. everyone wins.

## dev

```bash
npm test      # run tests
npm run check # lint/format
npm run build # compile ts
```

## docker

github actions builds multi-arch images and publishes to ghcr.io automatically.

## license

MIT