#!/bin/bash
set -e
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

avm install 0.30.1
avm use 0.30.1
anchor --version
