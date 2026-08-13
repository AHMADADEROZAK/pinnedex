#!/bin/bash
set -e

echo "=== Step 1: Source cargo ==="
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo "=== Step 2: Extract and install Solana ==="
cd /tmp
if [ ! -f /tmp/solana.tar.bz2 ]; then
    echo "Downloading Solana..."
    wget --timeout=300 -O /tmp/solana.tar.bz2 https://github.com/anza-xyz/agave/releases/download/v2.1.0/solana-release-x86_64-unknown-linux-gnu.tar.bz2
fi

echo "Extracting..."
mkdir -p /tmp/solana-install
cd /tmp/solana-install
tar -xjf /tmp/solana.tar.bz2
cd solana-release

echo "Copying to ~/.local/share/solana..."
mkdir -p ~/.local/share/solana/install/active_release
cp -r bin/ ~/.local/share/solana/install/active_release/
ls ~/.local/share/solana/install/active_release/bin/ | head -5

export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo "Solana version:"
solana --version

echo "=== Step 3: Install Anchor via AVM ==="
export PATH="$HOME/.cargo/bin:$PATH"
if ! command -v avm &> /dev/null; then
    echo "Installing AVM..."
    cargo install avm --locked
fi

echo "Installing anchor 0.30.1..."
avm install 0.30.1
avm use 0.30.1

echo "Anchor version:"
anchor --version

echo "=== Step 4: Generate test wallet ==="
solana-keygen new --no-bip39-passphrase -o /tmp/admin.json --force 2>/dev/null
solana config set --keypair /tmp/admin.json
solana config set --url localhost
solana config get

echo "=== ALL DONE ==="
