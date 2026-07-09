#!/usr/bin/env bash
# Build AwaazPay in WSL2 on ext4 for speed.
#
# Source of truth stays on the Windows mount (/mnt/d/www/awaazpay) where it is
# edited; this script rsyncs it to an ext4 build tree (~/awaazpay) and builds
# there — Gradle/Metro do thousands of small-file ops that are far faster on
# ext4 than over the 9p /mnt bridge.
#
# Usage (from Windows):
#   wsl -d Ubuntu -- bash /mnt/d/www/awaazpay/app/build-wsl.sh [--install] [--full] [task]
#
#   --install   Force `npm install` on the ext4 tree (also runs automatically
#               when node_modules is missing or package.json changed).
#   --full      Build the sideload flavor with the SMS receiver + RECEIVE_SMS
#               (AWAAZPAY_FLAVOR=full). Default is the Play-safe store flavor.
#   task        Gradle task, default :app:assembleDebug.
#
# Requirements in WSL: Java 17+, Android SDK at ~/Android/Sdk, Node 22 at
# ~/node22 (official nodejs.org tarball — see README).
set -euo pipefail

SRC="/mnt/d/www/awaazpay/app"
DEST="$HOME/awaazpay/app"
TASK=":app:assembleDebug"
FORCE_INSTALL=0

export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$HOME/node22/bin:$PATH"

for arg in "$@"; do
  case "$arg" in
    --install) FORCE_INSTALL=1 ;;
    --full) export AWAAZPAY_FLAVOR=full ;;
    *) TASK="$arg" ;;
  esac
done

command -v node >/dev/null || { echo "node not found — install Node 22 to ~/node22"; exit 1; }
[ -d "$ANDROID_HOME" ] || { echo "Android SDK not found at $ANDROID_HOME"; exit 1; }

echo "Syncing source → $DEST (ext4)…"
mkdir -p "$DEST"
# Sync editable source only. The generated app-level android/ (and ios/) are
# rebuilt on ext4 so cross-OS absolute paths never leak in — but LOCAL NATIVE
# MODULES under modules/*/android MUST sync, so anchor these excludes to the
# project root with a leading slash (unanchored 'android/' would also drop the
# module's native code and ship a JS-only app).
rsync -a --delete \
  --exclude '/node_modules/' \
  --exclude '/android/' \
  --exclude '/ios/' \
  --exclude '/.expo/' \
  --exclude '/dist/' \
  --exclude '/.gradle/' \
  "$SRC/" "$DEST/"

cd "$DEST"

if [ "$FORCE_INSTALL" = "1" ] || [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
  echo "Installing dependencies on ext4…"
  npm install
fi

echo "Prebuild (flavor: ${AWAAZPAY_FLAVOR:-store})…"
npx expo prebuild --platform android >/dev/null

echo "Gradle $TASK …"
cd android
sh gradlew "$TASK" --console=plain

# Locate whichever APK the task produced (debug or release)
echo
case "$TASK" in
  *[Rr]elease*) VARIANT="release" ;;
  *) VARIANT="debug" ;;
esac
APK="$DEST/android/app/build/outputs/apk/$VARIANT/app-$VARIANT.apk"
if [ -f "$APK" ]; then
  echo "APK: $APK"
  # Copy to the Windows tree: build-output/ for tooling, project root for phone sideload
  mkdir -p "$SRC/build-output"
  cp "$APK" "$SRC/build-output/app-$VARIANT.apk"
  cp "$APK" "/mnt/d/www/awaazpay/AwaazPay-$VARIANT.apk"
  echo "Copied to: $SRC/build-output/app-$VARIANT.apk"
  echo "Copied to: D:\\www\\awaazpay\\AwaazPay-$VARIANT.apk (for phone)"
fi
