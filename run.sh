#!/bin/bash

# Uptime Kuma Sentinel - Build and Run Script
# Edit the variables below for your setup

IMAGE="kuma-sentinel:1"
CONTAINER_NAME="kuma-sentinel"

# Configuration - EDIT THESE VALUES
KUMA_URL="http://dubtron.local:3001"  # Your Uptime Kuma URL
KUMA_USER="admin"                     # Your Uptime Kuma username
KUMA_PASS="changeme"                  # Your Uptime Kuma password
SENTINEL_NAME="INTERNET-SENTINEL"     # Name of your sentinel monitor
TAG_TO_SUPPRESS="internet-dependent"  # Tag for monitors to pause/resume

echo "🔨 Building Uptime Kuma Sentinel..."
docker build -t "$IMAGE" .

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Stop and remove existing container if it exists
if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🛑 Stopping and removing existing container..."
    docker stop "$CONTAINER_NAME" 2>/dev/null
    docker rm "$CONTAINER_NAME" 2>/dev/null
fi

echo "🚀 Starting Uptime Kuma Sentinel..."
docker run -d --name "$CONTAINER_NAME" --restart=unless-stopped \
  -e KUMA_URL="$KUMA_URL" \
  -e KUMA_USER="$KUMA_USER" \
  -e KUMA_PASS="$KUMA_PASS" \
  -e SENTINEL_NAME="$SENTINEL_NAME" \
  -e TAG_TO_SUPPRESS="$TAG_TO_SUPPRESS" \
  "$IMAGE"

if [ $? -eq 0 ]; then
    echo "✅ Sentinel started successfully!"
    echo "📋 Container name: $CONTAINER_NAME"
    echo "🔍 View logs: docker logs -f $CONTAINER_NAME"
    echo "🛑 Stop: docker stop $CONTAINER_NAME"

    echo ""
    echo "📊 Showing initial logs..."
    sleep 2
    docker logs "$CONTAINER_NAME"
else
    echo "❌ Failed to start container!"
    exit 1
fi
