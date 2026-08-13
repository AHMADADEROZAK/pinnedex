#!/bin/bash
set -e
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Get pre-built anchor binary URL
echo "Fetching release info..."
curl -sL --max-time 30 "https://api.github.com/repos/otter-sec/anchor/releases/tags/v0.30.1" -o /tmp/release.json

echo "Assets:"
python3 -c "
import json
with open('/tmp/release.json') as f:
    data = json.load(f)
for a in data.get('assets', []):
    print(a['name'], '->', a['browser_download_url'])
"

echo "Done"
