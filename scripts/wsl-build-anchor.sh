#!/bin/bash
set -e
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo "=== Building anchor-cli from source ==="
cd /tmp
git clone --depth 1 --branch v0.30.1 https://github.com/otter-sec/anchor anchor-src 2>&1
cd anchor-src/cli
cargo build --release 2>&1
echo "=== Build complete ==="

# Copy binary
cp target/release/anchor $HOME/.cargo/bin/anchor-cli
echo "=== Binary installed ==="

# Setup AVM
cd /tmp
rm -rf anchor-src

# Set anchor version
echo "0.30.1" > $HOME/.avm/.version
ln -sf $HOME/.cargo/bin/anchor-cli $HOME/.avm/bin/anchor-0.30.1 2>/dev/null || true

echo "=== Anchor version ==="
$HOME/.cargo/bin/anchor-cli --version
