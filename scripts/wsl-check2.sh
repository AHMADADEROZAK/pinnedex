#!/bin/bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"
which solana 2>/dev/null && solana --version || echo "solana not found"
ls -la $HOME/.cargo/bin/anchor 2>/dev/null || echo "anchor not built yet"
ls $HOME/.avm/bin/ 2>/dev/null || echo "no avm dir"
ls $HOME/.cargo/bin/avm 2>/dev/null || echo "no avm binary"
rustc --version
cargo --version
