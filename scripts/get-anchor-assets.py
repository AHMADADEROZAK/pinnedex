#!/usr/bin/env python3
import json, urllib.request, sys

url = "https://api.github.com/repos/otter-sec/anchor/releases/tags/v0.30.1"
req = urllib.request.urlopen(url)
data = json.load(req)
for a in data.get("assets", []):
    print(a["name"], "->", a["browser_download_url"])
