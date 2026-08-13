#!/bin/bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"

echo "=== Set Anchor version ==="
avm use 0.30.1
anchor --version

echo "=== Generate wallet ==="
solana-keygen new --no-bip39-passphrase -o $HOME/.config/solana/id.json --force 2>/dev/null
solana config set --url localhost

echo "=== Init Anchor project ==="
cd /mnt/d/Data/SPES-TECHNOLOGY/pin-dex
mkdir -p contracts
cd contracts
anchor init presale --no-git
cd presale
anchor build

echo "=== DONE ==="
