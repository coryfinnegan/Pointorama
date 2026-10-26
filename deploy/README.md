# Server deploy

The server pulls; nothing connects in to it. `pointorama-deploy.timer` runs
`poll-deploy.sh` every 2 minutes. It deploys the newest commit on `main` once
the CI `test` job has passed for that exact commit (checked through GitHub's
public API). Commits that don't touch `web/` or the app workflow are skipped.

Install (one time, as root on the server):

    cp deploy/deploy.sh deploy/poll-deploy.sh /opt/pointorama/
    chmod +x /opt/pointorama/deploy.sh /opt/pointorama/poll-deploy.sh
    cp deploy/pointorama-deploy.{service,timer} /etc/systemd/system/
    git -C /opt/pointorama/src remote set-url origin https://github.com/coryfinnegan/Pointorama.git
    systemctl daemon-reload && systemctl enable --now pointorama-deploy.timer

Logs: `journalctl -u pointorama-deploy`.

Change the admin PIN (also rotates the session secret, signing everyone out):

    cp deploy/set-pin.sh /opt/pointorama/ && chmod 700 /opt/pointorama/set-pin.sh
    ssh -t root@<tailscale-ip> /opt/pointorama/set-pin.sh
