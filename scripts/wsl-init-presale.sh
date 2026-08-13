#!/bin/bash
set -e
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo "=== Verify anchor ==="
anchor --version

echo "=== Init project ==="
cd /mnt/d/Data/SPES-TECHNOLOGY/pin-dex/contracts
anchor init presale --no-git 2>&1

echo "=== Build ==="
cd presale
anchor build 2>&1

echo "=== DONE ==="
