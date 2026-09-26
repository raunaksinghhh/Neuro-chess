#!/bin/bash
# start.sh — Build and start the Neuro-Chess C++ engine server
# Kills any existing instance on port 8080 first to avoid "Failed to bind" errors.

set -e
cd "$(dirname "$0")"

# ── Kill any stale server instance ───────────────────────────────────────────
existing=$(lsof -ti :8080 2>/dev/null || true)
if [ -n "$existing" ]; then
  echo "⚠️  Killing existing process on port 8080 (PID: $existing)..."
  kill -9 $existing 2>/dev/null || true
  sleep 0.3
fi

# ── Build if source is newer than binary ─────────────────────────────────────
needs_build=false
if [ ! -f neuro_engine_server ]; then
  needs_build=true
else
  for src in src/*.cpp src/*.hpp; do
    if [ "$src" -nt neuro_engine_server ]; then
      needs_build=true
      break
    fi
  done
fi

if $needs_build; then
  echo "🔨 Building Neuro-Chess C++ Engine..."
  make
  echo "✅ Build complete."
else
  echo "✅ Binary up to date, skipping build."
fi

# ── Start the server ──────────────────────────────────────────────────────────
echo "🚀 Starting engine server on port 8080..."
exec ./neuro_engine_server
