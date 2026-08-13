#!/bin/bash
set -e

echo "=== 1. Source cargo ==="
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo "PATH OK"

echo "=== 2. Install Solana CLI ==="
if ! command -v solana &> /dev/null; then
    curl -sSfL https://release.anza.xyz/v2.1.0/install | bash
fi
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version

echo "=== 3. Install Anchor via AVM ==="
if ! command -v avm &> /dev/null; then
    cargo install avm --locked
fi
export PATH="$HOME/.cargo/bin:$PATH"
avm install 0.30.1
avm use 0.30.1
anchor --version

echo "=== 4. Install Node/npm if needed ==="
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
node --version
npm --version

echo "=== 5. Generate test wallet ==="
solana-keygen new --no-bip39-passphrase -o /tmp/admin.json --force 2>/dev/null || true
solana config set --keypair /tmp/admin.json
solana config set --url localhost

echo "=== ALL DONE ==="
