#!/bin/bash
set -e
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"

echo "=== Installing anchor 0.30.1 via AVM ==="
avm install 0.30.1
echo "=== Setting version ==="
avm use 0.30.1
echo "=== Verify ==="
anchor --version
