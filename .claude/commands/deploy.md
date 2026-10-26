---
description: Deploy Pointorama to production by pushing to remote
---

Deploy Pointorama to production:

1. Make sure all changes are committed locally.
2. Run `git push origin main` — GitHub Actions handles the build and deploy to the production server automatically.
3. To check if the deploy succeeded, curl the live site: `curl -sk https://<tailscale-ip>/api/points | head -c 100`

That's it. No manual SSH or build steps needed.
