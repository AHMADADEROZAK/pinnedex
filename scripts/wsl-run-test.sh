#!/bin/bash
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

cd /mnt/d/Data/SPES-TECHNOLOGY/pin-dex/contracts/presale

echo "=== Init npm ==="
npm init -y 2>/dev/null
npm install gill typescript @types/node 2>&1 | tail -5

echo "=== Run test ==="
npx tsx tests/presale-test.ts 2>&1
