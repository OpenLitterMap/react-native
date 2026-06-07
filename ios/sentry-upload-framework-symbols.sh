#!/bin/sh
# Upload prebuilt React + Hermes RELEASE framework symbols to Sentry.
#
# Why: RN 0.84.1 ships React/Hermes as prebuilt frameworks. The copies embedded
# in the .app are stripped during archive (matching Debug ID, no symbols), so
# native React/Hermes frames are <unknown>. The release *artifact* tarballs hold
# the unstripped, symtab-bearing binaries with the SAME Debug IDs, so uploading
# them lets Sentry symbolicate those frames. Version-pinned: this uploads exactly
# the artifacts this RN/Hermes build embeds, so Debug IDs match by construction
# (no hardcoded IDs — those would break on the next RN/Hermes bump).
set -e

# Same guards as the app-dSYM build phase: never break a local/unconfigured build.
[ "${CONFIGURATION:-Release}" = "Debug" ] && { echo "[sentry] Debug build, skipping framework symbols"; exit 0; }
[ -z "$SENTRY_AUTH_TOKEN" ] && { echo "[sentry] SENTRY_AUTH_TOKEN unset, skipping framework symbols"; exit 0; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI="$ROOT/node_modules/@sentry/cli/bin/sentry-cli"
export SENTRY_PROPERTIES="$ROOT/ios/sentry.properties"

REACT_TGZ=$(ls "$ROOT"/ios/Pods/ReactNativeCore-artifacts/reactnative-core-*-release.tar.gz 2>/dev/null | head -1)
HERMES_TGZ=$(ls "$ROOT"/ios/Pods/hermes-engine-artifacts/hermes-ios-*-release.tar.gz 2>/dev/null | head -1)

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

upload() {
  tgz="$1"; name="$2"; binname="$3"
  if [ -z "$tgz" ] || [ ! -f "$tgz" ]; then
    echo "[sentry] WARNING: $name release artifact not found, skipping"
    return 0
  fi
  dest="$TMP/$name"
  mkdir -p "$dest"
  tar -xzf "$tgz" -C "$dest"

  # Structural gate: the device-arm64 binary must carry usable symbols.
  bin=$(find "$dest" -ipath "*ios-arm64/*" -type f -name "$binname" 2>/dev/null | grep -v simulator | head -1)
  if [ -z "$bin" ] || ! "$CLI" debug-files check "$bin" 2>&1 | grep -q "Usable: yes"; then
    echo "[sentry] ERROR: $name artifact has no usable symbols (arch ios-arm64) - aborting"
    exit 1
  fi
  echo "[sentry] $name symbols OK ($("$CLI" debug-files check "$bin" 2>&1 | grep -i 'Debug ID' | head -1 | tr -s ' '))"

  "$CLI" debug-files upload "$dest"
}

upload "$REACT_TGZ"  "react"  "React"
upload "$HERMES_TGZ" "hermes" "hermesvm"
echo "[sentry] framework symbol upload complete"
