# Uptime Kuma Sentinel

A lightweight Docker container that automatically pauses/resumes monitors in Uptime Kuma based on internet connectivity status.

## What It Does

When your internet goes down, this sentinel automatically pauses monitors tagged with a specific label (like `internet-dependent`) to prevent false alerts. When connectivity is restored, it resumes those monitors.

The sentinel works by:
1. Monitoring a "sentinel" monitor (typically checking an ultra-reliable service like Cloudflare DNS)
2. When the sentinel goes DOWN, it pauses all monitors with the specified tag
3. When the sentinel comes back UP, it resumes those monitors

## Quick Start

### 1. Prerequisites

- Uptime Kuma instance running and accessible
- Docker installed

### 2. Setup in Uptime Kuma

1. **Create a Sentinel Monitor:**
   - Type: TCP Port / HTTP(S) / Ping
   - Name: `INTERNET-SENTINEL` (or customize with `SENTINEL_NAME` env var)
   - Target: Something ultra-reliable like:
     - TCP: `1.1.1.1:53` (Cloudflare DNS)
     - HTTP: `https://www.google.com`
     - Ping: `8.8.8.8` (Google DNS)

2. **Tag Your Internet-Dependent Monitors:**
   - Add tag `internet-dependent` to monitors you want paused during outages
   - Or customize the tag name with `TAG_TO_SUPPRESS` env var

### 3. Run the Sentinel

```bash
# Quick start
docker run -d --name kuma-sentinel --restart=unless-stopped \
  -e KUMA_URL="http://your-kuma-host:3001" \
  -e KUMA_USER="admin" \
  -e KUMA_PASS="your-password" \
  kuma-sentinel:1

# With custom settings
docker run -d --name kuma-sentinel --restart=unless-stopped \
  -e KUMA_URL="http://your-kuma-host:3001" \
  -e KUMA_USER="admin" \
  -e KUMA_PASS="your-password" \
  -e SENTINEL_NAME="MY-INTERNET-CHECK" \
  -e TAG_TO_SUPPRESS="pause-on-outage" \
  kuma-sentinel:1
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KUMA_URL` | `http://localhost:3001` | URL to your Uptime Kuma instance |
| `KUMA_USER` | `admin` | Uptime Kuma username |
| `KUMA_PASS` | `changeme` | Uptime Kuma password |
| `SENTINEL_NAME` | `INTERNET-SENTINEL` | Name of the monitor that detects internet connectivity |
| `TAG_TO_SUPPRESS` | `internet-dependent` | Tag name for monitors to pause/resume |
| `INTERVAL_MS` | `5000` | ⚠️ *Currently unused* - real-time via WebSocket |

### Network Configuration

#### Same Host (Recommended)
If running on the same host as Uptime Kuma:

```bash
-e KUMA_URL="http://localhost:3001"
```

#### Different Host

```bash
-e KUMA_URL="http://your-uptime-kuma-host:3001"
```

#### Docker Networks
If both containers are on the same Docker network:

```bash
-e KUMA_URL="http://uptime-kuma-container-name:3001"
```

#### Docker Host Network

```bash
docker run --network host ... -e KUMA_URL="http://127.0.0.1:3001" ...
```

## Docker Compose

```yaml
version: '3.8'

services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    ports:
      - "3001:3001"
    volumes:
      - uptime-kuma-data:/app/data
    restart: unless-stopped

  kuma-sentinel:
    image: kuma-sentinel:1
    container_name: kuma-sentinel
    environment:
      - KUMA_URL=http://uptime-kuma:3001
      - KUMA_USER=admin
      - KUMA_PASS=your-secure-password
      - SENTINEL_NAME=INTERNET-SENTINEL
      - TAG_TO_SUPPRESS=internet-dependent
    depends_on:
      - uptime-kuma
    restart: unless-stopped

volumes:
  uptime-kuma-data:
```

## Building from Source

```bash
git clone <this-repository>
cd uptime-kuma-sentinel
docker build -t kuma-sentinel:1 .
```

## How It Works

### Technical Details

The sentinel uses Uptime Kuma's Socket.io API to:
1. Authenticate with your Uptime Kuma instance
2. Receive real-time monitor list and status updates
3. Watch for heartbeat events from the sentinel monitor
4. Execute pause/resume actions via the Socket.io API

### Status Mapping
- `0` = DOWN → Triggers pause action
- `1` = UP → Triggers resume action
- `2` = PENDING/MAINTENANCE → No action
- `3` = PAUSED → No action

### Logging
The sentinel provides detailed logging:

```
[sentinel] connecting to http://localhost:3001
[sentinel] socket connected, attempting login
[sentinel] login successful
[sentinel] received monitor list
[sentinel] watching "INTERNET-SENTINEL" (id=1); controlling 3 tagged monitors (internet-dependent)
[sentinel] initialization complete, monitoring...
[sentinel] heartbeat for sentinel: status=0, msg=Connection timeout
[sentinel] internet down -> pausing tagged monitors
[sentinel] paused monitor 2
[sentinel] paused monitor 3
[sentinel] paused monitor 4
[sentinel] all tagged monitors paused
```

## Troubleshooting

### Common Issues

**Connection Failed**

```
[sentinel] connection error: connect ECONNREFUSED
```

- Check `KUMA_URL` is correct and accessible
- Verify Uptime Kuma is running
- Check network connectivity between containers

**Login Failed**

```
[sentinel] login failed: Incorrect username or password
```

- Verify `KUMA_USER` and `KUMA_PASS` are correct
- Check if 2FA is enabled (not currently supported)

**Sentinel Monitor Not Found**

```
[sentinel] sentinel monitor "INTERNET-SENTINEL" not found
```

- Create a monitor with the exact name specified in `SENTINEL_NAME`
- Check spelling and case sensitivity

**No Tagged Monitors**

```
[sentinel] watching "INTERNET-SENTINEL" (id=1); controlling 0 tagged monitors
```

- Add the tag specified in `TAG_TO_SUPPRESS` to your monitors
- Ensure tag name matches exactly (case sensitive)

### Debug Tips

1. **Check container logs:**

   ```bash
   docker logs kuma-sentinel
   ```

2. **Test connection manually:**

   ```bash
   curl http://your-kuma-host:3001
   ```

3. **Verify monitor setup in Uptime Kuma web interface**

## Use Cases

### ISP Outages
Prevent false alerts when your internet connection drops but your local services are still running.

### Maintenance Windows
Temporarily pause external monitoring during scheduled network maintenance.

### Backup Connectivity
Use multiple sentinel monitors for different connection types (primary ISP, backup LTE, etc.).

### Development/Testing
Easily pause production monitors when testing network configurations.

## Limitations

- **2FA Not Supported**: Currently doesn't support Uptime Kuma instances with 2FA enabled
- **Single Sentinel**: Monitors only one sentinel at a time
- **Tag-Based Only**: Cannot pause monitors based on other criteria
- **No Notification Filtering**: Pauses entire monitors rather than just notifications

## Roadmap

- [ ] Support for multiple sentinel monitors
- [ ] 2FA authentication support
- [ ] Notification-only suppression (keep monitors running)
- [ ] Multiple tag support (`TAG_TO_SUPPRESS="tag1,tag2,tag3"`)
- [ ] Health check endpoint
- [ ] Metrics/Prometheus integration
- [ ] Web UI for configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with a real Uptime Kuma instance
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: Report bugs and feature requests
- Discussions: General questions and community support

---

**Note**: This project is not officially affiliated with Uptime Kuma. It uses Uptime Kuma's internal Socket.io API which may change between versions.
