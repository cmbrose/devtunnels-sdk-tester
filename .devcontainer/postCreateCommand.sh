#!/usr/bin/env bash
set -euo pipefail

# Install tsx globally
npm i -g tsx

# Install workspace dependencies
if [ -f ssh/package.json ]; then
  npm --prefix ssh ci || npm --prefix ssh install
fi

if [ -f demos/express/package.json ]; then
  npm --prefix demos/express ci || npm --prefix demos/express install
fi

if [ -f port-forwarding/package.json ]; then
  npm --prefix port-forwarding ci || npm --prefix port-forwarding install
fi

# Best-effort ensure AuthorizedKeysFile is set; no-op if sshd or sudo is unavailable
if [ -f /etc/ssh/sshd_config ]; then
  if grep -q "^#\?AuthorizedKeysFile" /etc/ssh/sshd_config; then
    sudo sed -i "s/^#\?AuthorizedKeysFile.*/AuthorizedKeysFile .ssh\/authorized_keys/" /etc/ssh/sshd_config || true
  else
    echo "AuthorizedKeysFile .ssh/authorized_keys" | sudo tee -a /etc/ssh/sshd_config >/dev/null || true
  fi
  (sudo systemctl restart ssh || sudo service ssh restart || sudo service sshd restart || true) >/dev/null 2>&1 || true
fi
