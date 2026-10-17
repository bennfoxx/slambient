#!/usr/bin/env bash
set -e

# Slambient DevOps Master Sync & Cloudflare Deployment Script
# Usage: ./scripts/devops-pipeline.sh [--deploy]

MAIN_DIR="/Users/benfox/Documents/Development/Slambient/main"
THREAD2_DIR="/Users/benfox/Documents/Development/Slambient/thread2"
BONSAI_DIR="/Users/benfox/Documents/Development/Slambient/bonsai"

echo "========================================================"
echo "⚡ SLAMBIENT DEVOPS AUTOMATION: SYNC, AUDIT & DEPLOY"
echo "========================================================"

cd "$MAIN_DIR"

echo ">>> [1/5] Running Pre-Flight QA Audit..."
node "$MAIN_DIR/scripts/qa-audit.js"

echo ">>> [2/5] Synchronizing Worktrees with main..."
if [ -d "$THREAD2_DIR/.git" ] || [ -f "$THREAD2_DIR/.git" ]; then
  echo "  -> Fast-forwarding thread2 (Art + Design)..."
  git -C "$THREAD2_DIR" merge --ff-only main || echo "  ▲ thread2 has diverged, manual merge may be needed."
fi

if [ -d "$BONSAI_DIR/.git" ] || [ -f "$BONSAI_DIR/.git" ]; then
  echo "  -> Fast-forwarding bonsai (Tech + MIDI)..."
  git -C "$BONSAI_DIR" merge --ff-only main || echo "  ▲ bonsai has diverged, manual merge may be needed."
fi

echo ">>> [3/5] Pushing all aligned branches to GitHub origin..."
git push origin main feature-thread2 experiment/midi-file-recorder || git push origin main

echo ">>> [4/5] Deploying build to Cloudflare Edge..."
npx wrangler deploy

echo ">>> [5/5] Deployment Successful!"
echo "Live URL: https://slambient-dev.ben-fox202.workers.dev"
echo "========================================================"
