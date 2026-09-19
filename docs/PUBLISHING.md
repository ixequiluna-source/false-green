# Update · September 19, 2026

The source now includes a verified package lock. Use npm ci. Local HTTP tests pass; see VERIFICATION-2026-09-19.md. The notes below describe the original archive handoff.

# Publication handoff

Target: `ixequiluna-source/false-green`, public, MIT.

The GitHub connection available during source delivery could read/write existing repositories but did not expose repository creation. The requested repository returned 404. **No remote repository, remote commit, release or CI success was reported as completed.**

## Owner-controlled publication from the archive

Prerequisites: Node 22+, Git, GitHub CLI and an authenticated `ixequiluna-source` account (`gh auth login`). Do not paste tokens into the project or a chat.

From the extracted `false-green` directory:

```bash
bash scripts/publish-github.sh
```

The script checks the account, refuses an existing local Git history or a visible existing target repository, asks for `PUBLISH`, installs dependencies, runs local + HTTP tests, initializes `main`, commits explicit project paths, and creates/pushes a public repo. It never force-pushes. It does not publish npm packages or create releases.

A generated package lock is included in that first commit after installation. This source archive does not fabricate an npm lock or integrity hashes: registry downloads were unavailable in the build environment. Review the generated lock and dependency audit in the publishing environment.

The script was syntax-checked, not executed against GitHub during delivery. A failure after initialization can leave a local commit or a newly created remote; inspect state before resuming. Never delete an existing repo to retry automatically.

## When the repository was created manually

Do not use the helper, which deliberately refuses an existing remote. For a genuinely empty repository, upload the reviewed source using Git or the connected GitHub file tools after confirming the exact owner, branch and current state. Existing content requires reconciliation, not overwrite.

## Before calling a release verified

Record the commit SHA and the successful CI run URL. Confirm the Node 22/24 jobs, HTTP tests and demo contract. Then create a prerelease deliberately. A green workflow definition or successful local demo is not hosted CI evidence.
