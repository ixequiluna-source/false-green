#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
owner="ixequiluna-source"
repo="false-green"
for command in gh git node npm; do
  command -v "$command" >/dev/null || { echo "Required tool missing: $command" >&2; exit 2; }
done
gh auth status --hostname github.com >/dev/null
login="$(gh api user --jq .login)"
[[ "$login" == "$owner" ]] || { echo "Authenticated as $login, expected $owner. Nothing published." >&2; exit 2; }
if [[ -d .git ]]; then
  echo "This publication helper is for a fresh source archive only. Existing .git found; nothing changed." >&2
  exit 2
fi
# Read before writing: refuse to touch an existing repository or any existing history.
if gh repo view "$owner/$repo" >/dev/null 2>&1; then
  echo "$owner/$repo already exists. This helper will not overwrite or push into it." >&2
  exit 2
fi
printf '\nTarget: %s/%s\nVisibility: PUBLIC\nLicense: MIT\n' "$owner" "$repo"
printf 'The following steps install dependencies, test the project, then create and push a NEW repository.\n'
read -r -p 'Type PUBLISH to proceed: ' confirmation
[[ "$confirmation" == PUBLISH ]] || { echo 'Cancelled. Nothing published.'; exit 2; }
npm install --ignore-scripts --no-audit --no-fund
npx playwright-core install chromium
npm run verify
npm run test:http
# Commit only explicit project paths; the commercial PDF and web catalog are separate.
git init -b main
if ! git config user.name >/dev/null; then git config user.name 'Ixequi Luna'; fi
if ! git config user.email >/dev/null; then
  user_id="$(gh api user --jq .id)"
  git config user.email "${user_id}+${owner}@users.noreply.github.com"
fi
git add .editorconfig .gitignore .github package.json tsconfig.json tsconfig.test.json \
  src tests examples scripts docs README.md README.es.md LICENSE SECURITY.md CONTRIBUTING.md CHANGELOG.md
if [[ -f package-lock.json ]]; then git add package-lock.json; fi
git commit -m 'feat: initial evidence-aware browser fault testing alpha'
gh repo create "$owner/$repo" --public --source . --remote origin --push \
  --description 'Break the product. Challenge the green. Evidence-aware browser fault testing with Playwright.'
printf '\nPublished repository: https://github.com/%s/%s\n' "$owner" "$repo"
printf 'CI has been triggered, not yet confirmed successful. Inspect it with:\n'
printf '  gh run list --repo %s/%s\n' "$owner" "$repo"
