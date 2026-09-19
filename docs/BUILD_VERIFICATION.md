> Historical build record. Clean installation and HTTP checks were subsequently completed: [September 19 verification](VERIFICATION-2026-09-19.md).

# Build verification · 2026-09-18

## Executed, not inferred

- `npm run build`: strict TypeScript compilation passed.
- `npm run test:unit`: 71 tests passed; zero skipped or failed.
- `npm run test:browser`: 18 real-Chromium, offline browser tests passed; zero skipped or failed.
- `npm run verify`: completed successfully after allowing sufficient execution time for the whole command.
- `npm run demo`: five stable survivors in the intentionally weak scenario, five stable detections in the behavior scenario; zero unresolved/unexercised cases. All eight clean-control trials passed. Twenty mutated trials plus eight controls, 28 trials total.
- `bash -n scripts/publish-github.sh`: publication helper syntax passed. The remote publication action was not executed.
- Standalone report rendered in Chromium at desktop and mobile widths; mobile document width equals viewport width (390 px). Wide evidence tables are intentionally horizontally scrollable.

## Actual local toolchain

Node v22.16.0; TypeScript 5.8.3; @types/node 24.0.4; Chromium 144.0.7559.96; preinstalled Playwright Core 1.57.0-beta-1764944708000.

The build container could not resolve the npm registry. Local compilation and execution used preinstalled packages via uncommitted links. `package.json` pins Playwright Core 1.56.1 as the clean-install target. **That exact registry install and browser pairing were not executed here.** A lockfile is intentionally not fabricated. The publication helper performs a clean install, verification and HTTP tests before creating a remote repository, and commits the generated lock.

## Not validated in this environment

The managed browser policy blocks URL navigation, including localhost HTTP. The HTTP integration suite encountered `ERR_BLOCKED_BY_ADMINISTRATOR`; it is not recorded as passed. The offline suite mounts synthetic HTML via `setContent` without network navigation and tests actual browser behavior. Policies were not modified.

`npm run test:http` remains a required validation on a machine permitting local HTTP navigation and is included in CI. Thus the DOM runner/demo has executed browser evidence; network routing has source and matcher tests but not a successful local HTTP end-to-end run in this environment.

No hosted GitHub Actions run, public repo, tag, release, npm package, dependency vulnerability audit, coverage percentage or independent security audit is claimed. The connector did not provide repository creation. See PUBLISHING.md.

One earlier combined verification command was externally interrupted at its execution time limit. Its report correctly became baseline-invalid after Chromium closed; a subsequent uninterrupted complete verification passed. Interrupted runs were not counted as successful evidence.
