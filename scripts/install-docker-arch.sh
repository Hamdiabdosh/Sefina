#!/usr/bin/env bash
# Install and enable Docker + Compose on Arch Linux (run once with sudo).
set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]] || ! command -v pacman >/dev/null 2>&1; then
  echo "This script is for Arch Linux (pacman)."
  exit 1
fi

echo "Installing docker and docker-compose..."
pacman -S --needed docker docker-compose

echo "Enabling and starting docker.service..."
systemctl enable --now docker

if ! getent group docker >/dev/null; then
  groupadd docker
fi

if id -nG "${SUDO_USER:-$USER}" | grep -qw docker; then
  echo "User already in docker group."
else
  usermod -aG docker "${SUDO_USER:-$USER}"
  echo "Added ${SUDO_USER:-$USER} to docker group."
  echo "Log out and back in (or run: newgrp docker) before using Docker without sudo."
fi

echo ""
docker --version
docker compose version
systemctl is-active docker
