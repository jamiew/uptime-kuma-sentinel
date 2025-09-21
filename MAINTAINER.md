# Maintainer's Guide to Not Breaking Everything 🛸

## Initial Setup (One-Time Pain)

### 1. GitHub Secrets (Settings → Secrets → Actions)

You don't need any. GitHub Actions already has `GITHUB_TOKEN` with write permissions for packages. That's it. We're using ghcr.io because Docker Hub wants money and we're not about that life.

### 2. Enable GitHub Packages

1. Go to Settings → Actions → General
2. Scroll to "Workflow permissions"
3. Select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Save

That's literally it. No Docker Hub account. No registry tokens. Just vibes.

## Release Process (For When It Actually Works)

### Creating a Release

```bash
# Make sure you're on main and it's not on fire
git checkout main
git pull

# Tag it (use semver like a responsible adult)
git tag -a v0.1.0 -m "v0.1.0: It works on my machine™"
git push origin v0.1.0

# GitHub will auto-build and push Docker images to ghcr.io
```

### What Happens Next (Magic)

1. GitHub Actions sees the tag
2. Builds multi-arch Docker images (amd64/arm64)
3. Pushes to `ghcr.io/jamiew/uptime-kuma-sentinel:v0.1.0`
4. Also tags as `latest` if it's the newest
5. You sleep better

## Docker Images Will Live At

```
ghcr.io/jamiew/uptime-kuma-sentinel:latest
ghcr.io/jamiew/uptime-kuma-sentinel:v0.1.0
ghcr.io/jamiew/uptime-kuma-sentinel:main
```

## Testing Before You Ship

```bash
# Local build (does it even work?)
docker build -t sentinel-test .

# Test run
docker run --rm \
  -e KUMA_URL=http://dubtron.local:3001 \
  -e KUMA_USER=admin \
  -e KUMA_PASS=yourpass \
  -e GROUP_TO_PAUSE=Sentinel \
  sentinel-test

# If it doesn't immediately explode, ship it
```

## PR Merge Strategy

1. Let Claude review it (it's smarter than us)
2. If CI is green and Claude is happy, YOLO merge
3. Delete the branch because we're not hoarders

## Emergency Procedures

### When Everything Is Broken

```bash
git reset --hard HEAD~1
git push --force
# Pretend it never happened
```

### When Users Complain

1. Check if their internet is actually working
2. Ask if they tried turning it off and on again
3. Blame their ISP
4. Actually fix the bug
5. Release v0.1.1 with commit message "fix: my bad"

## Monitoring Your Monitoring Monitor

The irony isn't lost on us. This thing monitors your monitors but who monitors the monitor monitor?

Nobody. We raw dog production.

## Release Cadence

Whenever something breaks or someone complains loud enough. No scheduled releases because schedules are for people with their life together.

## Security

- Never commit passwords (duh)
- The default password is "changeme" because of course it is
- If someone hacks your Uptime Kuma, you have bigger problems

## Support Policy

Issues are read when Mercury is in retrograde and I'm procrastinating on real work. PRs with tests get merged faster. PRs without tests get merged when I'm feeling dangerous.

## Future Features We'll Never Implement

- [ ] Web UI (terminal is love, terminal is life)
- [ ] Machine learning to predict when your ISP will fail (spoiler: always at 3am)
- [ ] Blockchain integration (lol no)
- [ ] Electron app (please no)
- [ ] Rewrite in Rust (maybe when I'm bored)

---

Remember: This started because my ISP sucks and I was tired of getting paged about it. If it works for you, cool. If it doesn't, PR welcome.

Stay weird. 🛸