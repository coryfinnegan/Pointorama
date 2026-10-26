#!/bin/bash
# Build and restart the app at a given commit (default: latest origin/main).
set -e

cd /opt/pointorama/src
git fetch origin main
git reset --hard "${1:-FETCH_HEAD}"

cd web
npm ci --prefer-offline
NODE_ENV=production npm run build

# Copy static assets into standalone (required for Next.js standalone mode)
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

systemctl restart pointorama
echo "Deploy complete"
