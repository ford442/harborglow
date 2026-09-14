#!/usr/bin/env python3
"""
HarborGlow static deploy.

Uploads `dist/` to https://storage.noahcohn.com as a single zip archive. The
server extracts it and pushes the files over one persistent SFTP connection,
which is much faster than uploading them individually. The real FTP/SFTP
credentials never leave the VPS.

Usage:
  npm run build
  export DEPLOY_TOKEN="your_long_token_from_vps_env"
  python deploy.py                # upload
  python deploy.py --dry-run      # list exactly what would be uploaded, send nothing

The app needs cross-origin isolation to run its WASM AudioWorklet audio engine,
which the host must supply as response headers — see the deployment section of
AGENTS.md. Without them the app still loads, but silently drops to a degraded
native-audio fallback.

Requirements:
  pip install requests
"""

import io
import os
import sys
import zipfile
from pathlib import Path
from typing import Optional

import requests

# ============================================================
# PER-PROJECT CONFIGURATION - EDIT THESE
# ============================================================
PROJECT_NAME: str = 'harborglow'
BUILD_DIR: str = 'dist'
CONTABO_BASE_URL: str = "https://storage.noahcohn.com"
DEPLOY_FOLDER: str = ""  # override remote target folder; empty = use PROJECT_NAME

# Deploy token (required for security).
# Set via environment: export DEPLOY_TOKEN="your_long_token_from_vps_env"
DEPLOY_TOKEN: Optional[str] = os.environ.get("DEPLOY_TOKEN")
# ============================================================



def fetch_remote_sizes(target_folder, target_site="test"):
    """Ask the VPS for {rel_path: bytes} already on the deploy target."""
    base = CONTABO_BASE_URL.rstrip("/")
    url = f"{base}/api/deploy/{PROJECT_NAME}/sizes"
    headers = {}
    token = globals().get("DEPLOY_TOKEN")
    if token:
        headers["X-Deploy-Token"] = token
    params = {"target_site": target_site or "test"}
    if target_folder:
        params["target_folder"] = target_folder
    try:
        response = requests.get(url, params=params, headers=headers, timeout=60)
        if response.status_code == 200:
            files = response.json().get("files") or {}
            print(f"Remote size map: {len(files)} file(s)")
            return {str(k).replace("\\", "/"): int(v) for k, v in files.items()}
        print(f"  ! sizes HTTP {response.status_code}; uploading all files")
    except Exception as exc:
        print(f"  ! Could not fetch remote sizes ({exc}); uploading all files")
    return {}


def build_zip(build_path: Path, skip_sizes=None) -> bytes:
    """Zip the contents of build_path into an in-memory archive."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for file in sorted(build_path.rglob("*")):
            if file.is_dir():
                continue
            rel = file.relative_to(build_path)
            # Skip common junk
            parts = rel.parts
            if any(p in (".git", "node_modules", "__pycache__") for p in parts):
                continue
            # Dotfiles are never something a browser asks for. `public/` carries
            # a .gitkeep that Vite copies into dist/ verbatim, and an editor or
            # OS can leave .DS_Store / .swp behind in there too.
            if any(p.startswith(".") for p in parts):
                print(f"  - {rel} (dotfile, not published)")
                continue
            rel_s = str(rel).replace("\\", "/")
            local_size = file.stat().st_size
            if (skip_sizes or {}).get(rel_s) == local_size:
                print(f"  = {rel} ({local_size} bytes, unchanged)")
                continue
            zf.write(file, rel_s)
            print(f"  + {rel}")
    return buf.getvalue()


def deploy_bundle(build_path: Path, dry_run: bool = False) -> bool:
    """Zip the build and upload it as a single bundle."""
    target_folder = DEPLOY_FOLDER or PROJECT_NAME
    url = f"{CONTABO_BASE_URL}/api/deploy/{PROJECT_NAME}/bundle"
    headers = {}
    if DEPLOY_TOKEN:
        headers["X-Deploy-Token"] = DEPLOY_TOKEN

    print("Building zip archive...")
    target_folder_for_sizes = globals().get("DEPLOY_FOLDER") or globals().get("TARGET_FOLDER") or PROJECT_NAME
    if "target_folder" in locals() and target_folder:
        target_folder_for_sizes = target_folder
    target_site_for_sizes = globals().get("DEPLOY_TARGET", "test")
    if dry_run:
        # Size comparison is a GET, so it is safe, but it needs the token; skip it
        # in a dry run so `--dry-run` works without one and every file is listed.
        print("Skipping remote size check (dry run): listing every file.")
        skip_sizes = {}
    else:
        print("Checking remote file sizes...")
        skip_sizes = fetch_remote_sizes(target_folder_for_sizes, target_site_for_sizes)
    zip_bytes = build_zip(build_path, skip_sizes)
    print(f"Archive size: {len(zip_bytes) / 1024:.1f} KB\n")

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as _zf:
        names = _zf.namelist()
        if not names:
            print("All files identical in size on the target; nothing to upload.")
            return True

    if dry_run:
        print(f"DRY RUN: would upload {len(names)} file(s) to "
              f"{target_folder}/ at {CONTABO_BASE_URL}. Nothing was sent.")
        return True

    print("Uploading bundle...")
    try:
        response = requests.post(
            url,
            files={"bundle": ("build.zip", zip_bytes, "application/zip")},
            data={"target_folder": target_folder},
            headers=headers,
            timeout=300,
        )
    except Exception as exc:
        print(f"  \u2717 Upload exception: {exc}")
        return False

    if response.status_code == 200:
        data = response.json()
        print(f"  \u2713 {data.get('uploaded', 0)} files uploaded")
        if data.get("failed"):
            print("  Failures:")
            for f in data["failed"]:
                print(f"    \u2717 {f['path']}: {f['error']}")
        return not data.get("failed")
    else:
        print(f"  \u2717 {response.status_code}: {response.text[:400]}")
        return False


def main():
    dry_run = "--dry-run" in sys.argv[1:]
    unknown = [arg for arg in sys.argv[1:] if arg != "--dry-run"]
    if unknown:
        print(f"ERROR: unknown argument(s): {' '.join(unknown)}")
        print("Usage: python deploy.py [--dry-run]")
        sys.exit(2)

    label = "Dry run for" if dry_run else "Deploying"
    print(f"\n=== {label} '{PROJECT_NAME}' via {CONTABO_BASE_URL} ===\n")

    build_path = Path(BUILD_DIR)
    if not build_path.exists() or not build_path.is_dir():
        print(f"ERROR: Build directory '{BUILD_DIR}/' does not exist.")
        print("Please run your build command first (e.g. `npm run build`).")
        sys.exit(1)

    # Without the token the server rejects the upload anyway, but it does so
    # after the whole archive has been built and sent. Fail here instead, and
    # say how to set it — the value is read from the environment only, by design.
    if not DEPLOY_TOKEN and not dry_run:
        print("ERROR: DEPLOY_TOKEN is not set.")
        print("This script reads the token from the environment only; it is never")
        print("stored in the repository. Set it in your shell and re-run:")
        print('  export DEPLOY_TOKEN="your_long_token_from_vps_env"')
        print("To see what would be uploaded without a token, use --dry-run.")
        sys.exit(1)

    try:
        health = requests.get(f"{CONTABO_BASE_URL}/api/deploy/health", timeout=10)
        if health.status_code == 200:
            print(f"Contabo deploy service: {health.json().get('status', 'unknown')}")
    except Exception:
        print("Warning: Could not contact storage.noahcohn.com (continuing anyway).")

    print()
    success = deploy_bundle(build_path, dry_run=dry_run)

    if dry_run:
        print("\n=== Dry run complete; nothing was uploaded ===")
    else:
        print(f"\n=== {'Deployment complete' if success else 'Deployment finished with errors'} ===")
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
