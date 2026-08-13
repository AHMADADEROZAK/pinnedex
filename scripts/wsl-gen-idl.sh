#!/bin/bash
export CARGO_HOME="$HOME/.cargo"
export SOLANA_HOME="$HOME/.local/share/solana/install/active_release"
export PATH="$CARGO_HOME/bin:$SOLANA_HOME/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

cd /mnt/d/Data/SPES-TECHNOLOGY/pin-dex/contracts/presale

echo "=== Generate IDL ==="
anchor idl parse --file programs/presale/src/lib.rs --out-json target/idl/presale.json 2>&1 || true

echo "=== Check IDL ==="
ls -la target/idl/ 2>/dev/null || echo "no idl dir"
