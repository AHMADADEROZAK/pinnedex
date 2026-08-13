#!/bin/bash
export CARGO_HOME="$HOME/.cargo"
export SOLANA_HOME="$HOME/.local/share/solana/install/active_release"
export PATH="$CARGO_HOME/bin:$SOLANA_HOME/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

echo "=== anchor version ==="
anchor --version

echo "=== building ==="
cd /mnt/d/Data/SPES-TECHNOLOGY/pin-dex/contracts/presale
anchor build 2>&1
echo "=== exit code: $? ==="
