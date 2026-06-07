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
#
# Best-effort by design: this is a SUPPLEMENTARY step. The primary phase
# (sentry-xcode-debug-files.sh, run just before this) already uploads the app
# dSYM plus React/Hermes/ReactNativeDependencies with matching Debug IDs, so a
# hiccup here only costs some unstripped React/Hermes symbol coverage — it must
# NEVER fail the archive. Hence: no `set -e`, every failure path warns + skips,
# and the verification is informational (logs the real `debug-files check`
# output) rather than a hard gate. Sentry merges by Debug ID and ignores symbol
# files whose Debug ID the build doesn't reference, so "upload anyway" is safe.

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
  if ! tar -xzf "$tgz" -C "$dest"; then
    echo "[sentry] WARNING: $name artifact failed to extract, skipping"
    return 0
  fi

  # Locate the device-arm64 binary (informational verification only).
  bin=$(find "$dest" -ipath "*ios-arm64/*" -type f -name "$binname" 2>/dev/null | grep -v simulator | head -1)
  if [ -z "$bin" ]; then
    echo "[sentry] WARNING: $name arm64 binary ('$binname') not found in artifact; extracted layout:"
    find "$dest" -maxdepth 4 -type d 2>/dev/null | sed 's/^/[sentry]     /'
    echo "[sentry] skipping $name (nothing to upload)"
    return 0
  fi

  # Log the actual check output so any in-build discrepancy is visible in the
  # build log instead of silently swallowed. Never abort on it.
  check=$("$CLI" debug-files check "$bin" 2>&1 || true)
  echo "[sentry] $name debug-files check ($bin):"
  echo "$check" | sed 's/^/[sentry]     /'
  echo "$check" | grep -q "Usable: yes" \
    && echo "[sentry] $name symbols verified usable" \
    || echo "[sentry] WARNING: $name check did not report 'Usable: yes' — uploading anyway (best-effort)"

  # Upload the whole extracted artifact; sentry-cli picks up every usable slice
  # and dedupes by Debug ID. Non-fatal on failure.
  "$CLI" debug-files upload "$dest" || echo "[sentry] WARNING: $name symbol upload failed (non-fatal)"
}

upload "$REACT_TGZ"  "react"  "React"
upload "$HERMES_TGZ" "hermes" "hermesvm"
echo "[sentry] framework symbol upload complete"
exit 0
