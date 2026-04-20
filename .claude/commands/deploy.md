---
description: Build and deploy Pointorama to the production server
---

Deploy Pointorama to the production server. Follow these steps exactly:

1. Run `cd /c/Users/coryf/Pointorama/web && npm run build` locally. If it fails, fix the errors first and do not continue.
2. SSH as `cory@100.87.143.68`. The user SSH key should work automatically.
3. On the server, run:
   ```
   cd /opt/pointorama && git pull
   cd src/web && npm ci --omit=dev
   npm run build
   cp -r .next/standalone /opt/pointorama/app-new
   cp -r .next/static /opt/pointorama/app-new/.next/static
   cp -r public /opt/pointorama/app-new/public
   ```
4. Swap and restart:
   ```
   sudo systemctl stop pointorama
   rm -rf /opt/pointorama/app-old && mv /opt/pointorama/app /opt/pointorama/app-old || true
   mv /opt/pointorama/app-new /opt/pointorama/app
   sudo systemctl start pointorama
   ```
5. Verify the service is running: `sudo systemctl status pointorama`
6. Do a quick smoke test: `curl -sk https://100.87.143.68/ | head -5` (the `-k` skips cert CN check since we're hitting by IP not hostname)

If the deploy script `/opt/pointorama/deploy.sh` exists and is up to date, prefer running that instead of the manual steps above.

The server IP is 100.87.143.68. The app runs as a systemd service named `pointorama`. The Next.js standalone build lives at `/opt/pointorama/app/server.js`. SQLite DB is at the path in `DB_PATH` env var.
