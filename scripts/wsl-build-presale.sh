#!/bin/bash
set -e
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
cd /mnt/d/Data/SPES-TECHNOLOGY/pin-dex/contracts/presale
echo "Starting build at $(date)" > /tmp/build.log
anchor build >> /tmp/build.log 2>&1
echo "Build finished at $(date) with exit $?" >> /tmp/build.log
cat /tmp/build.log
