# Verification · September 19, 2026

## Source recovery

Recovered the original `false-green-0.1.0-alpha.1.zip` supplied by Ixequi Luna. All 44 entries in its SHA-256 source manifest matched before editing. No source files were reconstructed from the HTML report. Original build limitations remain recorded in BUILD_VERIFICATION.md as historical evidence.

## Executed locally

- Windows, Node 24.15.0.
- Registry dependencies installed at declared versions; genuine package-lock.json generated.
- `npm ci --ignore-scripts`: successful clean installation from that lock.
- Playwright Core 1.56.1, Chromium 141.0.7390.37 (build 1194), downloaded using that installed Playwright version.
- Strict TypeScript build and no-emit check passed.
- Unit suite: 71 passed, zero failed/skipped.
- Offline browser suite: 18 passed, zero failed/skipped.
- HTTP integration suite: 20 passed, zero failed/skipped, using disposable loopback servers.
- Demo: 5 survivors in the weak suite and the same 5 detections in the behavioral suite; all clean controls valid; no unresolved or unexercised faults.
- npm installation audit: zero known vulnerabilities reported across the five audited packages at execution time. This is not a security certification.

The HTTP limitation documented during the original build did not recur here. The network tests verify response replacement, aborted requests, malformed images, origin filtering and runner attribution against an actual local server.

## Review and changes

Reviewed configuration validation, activation evidence, result classification, report escaping, timeout handling and documented trust boundaries. The report is not an isolation boundary: suite code is trusted Node code, and the browser origin router does not constrain WebSockets, Node requests or custom routes.

Added a real dependency lock and changed CI to `npm ci`. Retained Ixequi Luna as author and copyright holder, the supplied MIT license, and the original implementation. No AI coauthor trailer is added.

## Release boundary

Local validation is complete for the scenarios above. Remote repository creation, hosted CI and any release publication must be verified separately. No npm package publication, real targets, production payments or customer data are involved.
