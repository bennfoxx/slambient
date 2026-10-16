#!/bin/bash
# Double-click to commit everything in this folder and push it to GitHub (origin/main).
# Safe: never force-pushes. If the push is rejected it pulls with rebase and retries once.

cd "$(dirname "$0")" || exit 1
BRANCH="main"

pause() { echo; read -n 1 -s -r -p "Press any key to close..."; echo; }
fail()  { echo; echo "FAILED: $1"; pause; exit 1; }

echo "== Slambient push =="
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "this folder is not a git repo"

# Use the Mac's own git identity if one is set, otherwise fall back to a default
IDENT=()
if [ -z "$(git config user.email)" ]; then
  IDENT=(-c user.name="Ben Fox" -c user.email="benfox@FenMac-2.local")
fi

# Clear stale lock files left by a crashed git process (only if no git is running)
if ! pgrep -x git >/dev/null 2>&1; then
  find .git -maxdepth 2 -name '*.lock' -type f -delete 2>/dev/null
fi
# Check for parallel branch/worktree changes in slambient_dev-thread2 (feature-thread2)
THREAD2_DIR="../slambient_dev-thread2"
if [ -d "$THREAD2_DIR/.git" ] || [ -f "$THREAD2_DIR/.git" ]; then
  if [ -n "$(git -C "$THREAD2_DIR" status --porcelain 2>/dev/null)" ]; then
    echo "⚠️  Note: uncommitted working tree changes detected in $THREAD2_DIR"
  fi
fi

if git show-ref --verify --quiet refs/heads/feature-thread2; then
  UNMERGED_THREAD2=$(git rev-list --count main..feature-thread2 2>/dev/null || echo "0")
  if [ "$UNMERGED_THREAD2" -gt 0 ]; then
    echo "Merging $UNMERGED_THREAD2 commit(s) from feature-thread2 into main..."
    git "${IDENT[@]}" merge --no-ff feature-thread2 -m "Merge branch 'feature-thread2' into main" || fail "Merge conflict merging feature-thread2 into main. Please resolve before pushing."
  fi
fi

if [ -n "$(git status --porcelain)" ]; then
  echo
  git status --short
  echo
  DEFAULT="Update $(date '+%Y-%m-%d %H:%M')"
  read -r -p "Commit message (Enter for \"$DEFAULT\"): " MSG
  MSG="${MSG:-$DEFAULT}"
  git add -A || fail "git add"
  git "${IDENT[@]}" commit -m "$MSG" || fail "git commit"
else
  echo "Nothing new to commit."
fi

git fetch origin "$BRANCH" >/dev/null 2>&1
AHEAD=$(git rev-list --count "origin/$BRANCH..HEAD" 2>/dev/null || echo "?")
if [ "$AHEAD" = "0" ]; then
  echo "Already up to date with GitHub. Nothing to push."
  pause; exit 0
fi

echo
echo "Pushing $AHEAD commit(s) to origin/$BRANCH..."
if ! git push origin "$BRANCH"; then
  echo
  echo "Push rejected. Pulling GitHub's changes and retrying once..."
  git "${IDENT[@]}" pull --rebase origin "$BRANCH" || fail "pull --rebase hit a conflict. Run 'git status' in this folder to resolve it, or ask Claude."
  git push origin "$BRANCH" || fail "push still failing"
fi

echo
echo "Done. Latest commit:"
git log -1 --oneline
pause
