#!/bin/bash
export PATH="/tmp/node-v22.10.0-linux-x64/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export CARGO_HOME="$HOME/.cargo"
export SOLANA_HOME="$HOME/.local/share/solana/install/active_release"

cd /mnt/d/Data/SPES-TECHNOLOGY/pin-dex

npm install --no-save @solana/kit @solana-program/program-metadata 2>&1 | tail -3

npx @solana-program/program-metadata write security \
  6t8hLg3DvTYzXkm3gfNhMfgqh2x1akjjM2zwv8SMprA3 \
  ./security.json 2>&1

echo "EXIT: $?"
