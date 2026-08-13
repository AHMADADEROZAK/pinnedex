#!/bin/bash
set -e
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo "=== Remove old AVM ==="
rm -rf $HOME/.avm $HOME/.cargo/bin/avm $HOME/.cargo/bin/anchor

echo "=== Install AVM from official repo ==="
cargo install --git https://github.com/solana-foundation/anchor avm --force 2>&1

echo "=== Install latest Anchor ==="
avm install latest 2>&1
avm use latest 2>&1

echo "=== Verify ==="
anchor --version
