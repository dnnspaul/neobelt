#!/bin/bash
set -euo pipefail

APP_NAME="neobelt"
APP_PATH="./bin/$APP_NAME.app"
DMG_PATH="../$APP_NAME.dmg"

# Use Developer ID certificates for direct distribution (outside the Mac App Store)
# You can override these by exporting APP_CERTIFICATE / PKG_CERTIFICATE in your environment.
APP_CERTIFICATE=${APP_CERTIFICATE:-"Developer ID Application: Dennis Paul (TYY3Q6XMR9)"}
PKG_CERTIFICATE=${PKG_CERTIFICATE:-"Developer ID Installer: Dennis Paul (TYY3Q6XMR9)"}

# If set, will be used for notarization via `xcrun notarytool`
# Configure once with: xcrun notarytool store-credentials AC_NOTARY --apple-id "you@example.com" --team-id "TYY3Q6XMR9" --password "app-specific-password"
NOTARY_PROFILE=${NOTARY_PROFILE:-"AC_NOTARY"}

# Build the app if needed
cd ..
wails build -platform darwin/universal -clean
cd build

# Ensure the app bundle exists
if [ ! -d "$APP_PATH" ]; then
  echo "App bundle not found at $APP_PATH. Build the app first."
  exit 1
fi

# Sign the app bundle (hardened runtime is required for notarization)
codesign --timestamp --options=runtime --force --deep \
  -s "$APP_CERTIFICATE" -v \
  --entitlements ./darwin/entitlements.plist \
  "$APP_PATH"

echo "Creating DMG..."
# Staging directory for DMG contents
STAGE_DIR="$(mktemp -d -t ${APP_NAME}_dmg_XXXXXX)"
trap 'rm -rf "$STAGE_DIR"' EXIT

# Copy the app and create Applications symlink
# Use ditto to preserve all metadata and permissions
ditto "$APP_PATH" "$STAGE_DIR/$(basename "$APP_PATH")"
ln -s /Applications "$STAGE_DIR/Applications"

# Remove existing DMG
rm -f "$DMG_PATH"

# Create compressed DMG
hdiutil create \
  -volname "$APP_NAME" \
  -srcfolder "$STAGE_DIR" \
  -format UDZO \
  -fs HFS+ \
  -ov "$DMG_PATH"

# Sign the DMG file (required for Gatekeeper acceptance)
echo "Signing DMG..."
codesign --timestamp --force \
  -s "$APP_CERTIFICATE" \
  "$DMG_PATH"

# Optionally verify DMG integrity
# hdiutil verify "$DMG_PATH" | cat

# Verify signatures
# codesign -dv --verbose=4 "$APP_PATH" | cat
# codesign -dv --verbose=4 "$DMG_PATH" | cat

# Notarize and staple (optional, but recommended to avoid Gatekeeper warnings on other Macs)
if [ -n "$NOTARY_PROFILE" ]; then
  echo "Submitting $DMG_PATH for notarization using profile '$NOTARY_PROFILE'..."
  xcrun notarytool submit "$DMG_PATH" --keychain-profile "$NOTARY_PROFILE" --wait
  echo "Stapling notarization ticket..."
  xcrun stapler staple "$DMG_PATH"
  xcrun stapler validate "$DMG_PATH" | cat
else
  echo "Skipping notarization. Set NOTARY_PROFILE to notarize and avoid Gatekeeper warnings."
fi

# Gatekeeper assessment (should say 'accepted')
spctl -a -vv --type install "$DMG_PATH" | cat
echo "DMG created at: $DMG_PATH"