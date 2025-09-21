FROM node:20-alpine

# App dir
WORKDIR /app

# Install socket.io client
RUN npm i socket.io-client@latest

# Add the script
COPY sentinel.mjs /app/sentinel.mjs

# Default envs (override at runtime)
ENV KUMA_URL=http://localhost:3001 \
  KUMA_USER=admin \
  KUMA_PASS=changeme \
  SENTINEL_NAME=INTERNET-SENTINEL \
  TAG_TO_SUPPRESS=internet-dependent \
  INTERVAL_MS=5000

CMD ["node", "/app/sentinel.mjs"]
