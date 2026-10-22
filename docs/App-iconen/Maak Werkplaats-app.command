#!/bin/zsh
set -eu
base="$(cd "$(dirname "$0")" && pwd)"
if [[ -d "$base/Bestanden" ]]; then
  icon="$base/Bestanden/App-iconen/app-icon.icns"
elif [[ -f "$base/../Begin hier.html" ]]; then
  base="$(cd "$base/.." && pwd)"
  icon="$base/App-iconen/app-icon.icns"
else
  print 'Laat dit bestand bij je uitgepakte Werkplaats staan.'; exit 1
fi
(cd "$(dirname "$icon")" && /usr/bin/shasum -a 256 -c hashes.sha256)
app="$base/Werkplaats.app"
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources"
cp "$icon" "$app/Contents/Resources/FMT-werkplaats-familie.icns"
cat > "$app/Contents/MacOS/start" <<'START'
#!/bin/zsh
set -eu
base="$(cd "$(dirname "$0")/../../.." && pwd)"
exec /usr/bin/open -a "Google Chrome" "$base/Begin hier.html"
START
chmod +x "$app/Contents/MacOS/start"
cat > "$app/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>CFBundleName</key><string>Werkplaats</string><key>CFBundleExecutable</key><string>start</string><key>CFBundleIconFile</key><string>FMT-werkplaats-familie.icns</string><key>CFBundleIdentifier</key><string>nl.fastmovingtargets.werkplaats.download</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleVersion</key><string>1</string></dict></plist>
PLIST
/usr/bin/codesign --force --sign - --identifier nl.fastmovingtargets.werkplaats.download "$app"
print 'Werkplaats.app staat klaar. Laat de app bij deze bestanden staan en sleep haar naar het Dock.'
