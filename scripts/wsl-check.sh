#!/bin/bash
set -e
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"
echo "=== Versions ==="
solana --version 2>&1 || echo "solana: NOT FOUND"
anchor --version 2>&1 || echo "anchor: NOT FOUND"
rustc --version
cargo --version
echo "=== Solana config ==="
solana config get 2>&1 || true
