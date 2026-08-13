#!/bin/bash
export CARGO_HOME="$HOME/.cargo"
export SOLANA_HOME="$HOME/.local/share/solana/install/active_release"
export PATH="$CARGO_HOME/bin:$SOLANA_HOME/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

cd /mnt/d/Data/SPES-TECHNOLOGY/pin-dex/contracts/presale

# generate IDL
anchor build --idl 2>&1 | tail -5

echo "=== IDL files ==="
find target -name "*.json" -path "*/idl/*" 2>/dev/null
ls target/idl/ 2>/dev/null || echo "no idl"

echo "=== Install npm deps ==="
npm init -y 2>/dev/null
npm install gill @coral-xyz/anchor @types/node typescript 2>&1 | tail -5

echo "=== Done ==="
