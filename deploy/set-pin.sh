#!/bin/bash
# Interactively set a new admin PIN and rotate the session secret (signs out all sessions).
# The PIN is typed on the server and never stored in plain text.
set -euo pipefail
read -rsp "New admin PIN (6+ digits): " PIN; echo
read -rsp "Repeat PIN: " PIN2; echo
[ "$PIN" = "$PIN2" ] || { echo "PINs don't match"; exit 1; }
[[ "$PIN" =~ ^[0-9]{6,}$ ]] || { echo "PIN must be at least 6 digits"; exit 1; }

HASH=$(cd /opt/pointorama/src/web && PIN="$PIN" node -e '
const b = require("bcryptjs");
process.stdout.write(Buffer.from(b.hashSync(process.env.PIN, 12)).toString("base64"));')
SECRET=$(openssl rand -hex 32)

for f in /opt/pointorama/app/.env.production /opt/pointorama/src/web/.env.production; do
  cp "$f" "$f.bak"
  sed -i "s|^ADMIN_PIN_HASH=.*|ADMIN_PIN_HASH=$HASH|; s|^SESSION_SECRET=.*|SESSION_SECRET=$SECRET|" "$f"
  chmod 600 "$f" "$f.bak"
done
systemctl restart pointorama
echo "Admin PIN updated, sessions reset. Old env files kept as *.bak (delete once you've logged in)."
