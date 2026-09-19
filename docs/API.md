# API reference · 0.1 alpha

## Suite

`defineSuite({ name, baseURL, scenarios, repetitions?, timeoutMs?, allowedOrigins?, allowRemoteTargets?, reset?, html? })`

`repetitions` defaults to 2, accepts integers 2–10. `timeoutMs` defaults to 10,000, accepts 100–300,000. A trial timeout includes reset, page creation, exercise and verification. Browser cleanup is outside the nominal trial deadline. Trusted Node callbacks must honor `signal`; arbitrary synchronous code cannot be preempted in-process.

In URL mode `baseURL` must be HTTP(S), without embedded credentials, query or fragment. `allowedOrigins` contains exact origins and must include the base origin. Only `localhost`, `127.0.0.1` and `[::1]` are accepted without `allowRemoteTargets: true`. This is an accidental-targeting guard, not hostname attestation or protection against DNS rebinding.

In offline mode provide `baseURL: 'about:blank'` and `html: '<!doctype html>...'`. Browser HTTP(S) origins must remain empty. HTML is mounted before each journey and DOM operators are then activated on that document. Scripts in this trusted fixture can run; it is not an untrusted HTML sanitizer. Navigating away or calling `document.open()` again may discard DOM listeners; keep the offline journey in the mounted document.

Each scenario has a unique lowercase slug, title, `exercise`, `verify`, and nonempty list of mutations. Mutation IDs are unique within the scenario. IDs are 1–80 characters. `exercise` and `verify` receive `{ page, baseURL, signal }`. `reset` receives `{ scenarioId, mutationId, trial, phase, signal }` before **every** run. It must reset backend state or provision unique test data when needed.

## Mutations

All operators take `id`, `title` and `kind`.

- `block-click`: `selector`. Capture-phase cancellation of a matching click. The target is found through `composedPath`. This does not cancel pointerdown or arbitrary custom events.
- `replace-text`: `selector`, `value`. Replaces the full text content, potentially removing nested markup. A MutationObserver handles ordinary later DOM changes.
- `hide-element`: `selector`. Applies inline `display:none !important` to HTML elements. It does not prove that something was visible before mutation.
- `remove-attribute`: `selector`, `attribute`. Removes an existing attribute. No existing attribute means no hit.
- `break-image`: exactly one of `selector` or `path`. Selector mode corrupts `src` and removes the image's `srcset`; it is designed for simple `<img>` elements. Path mode returns invalid image bytes for an intercepted image request. Responsive `<picture>`, CSS background images and shadow roots are not generally supported by the selector mode.
- `route-response`: `path`, `status` (200–599), `body` (string), optional `method` and `contentType` (defaults to application/json). 204, 205 and 304 require an empty body. The response can be behaviorally equivalent; a fulfillment hit alone does not prove the replacement is a relevant defect.
- `route-abort`: `path`, optional `method`. Aborts matching browser requests.

Network matching uses the exact URL pathname and optional uppercase method, across the configured allowed origins. Query strings are ignored. Restrict allowed origins where paths overlap. No wildcard, glob or regex matching is implemented. The router is context-level; custom page routes can supersede it. A route that never reaches the injector produces no activation evidence.

## Assertions

`check(value, message)` throws a native Node AssertionError when falsy.

`eventually(predicate, message, { timeoutMs = 1500, intervalMs = 25, signal } = {})` polls a boolean predicate and raises an assertion on expiry. Predicate exceptions propagate as infrastructure/verification errors, not detections. Pick a polling timeout below the total trial timeout.

Native `node:assert/strict` assertions are supported. Generic errors and assertion implementations that do not produce Node AssertionError are not treated as detections in this alpha.

## Runner and reporting

`await runSuite(suite, { executablePath?, headless?, suiteFileSha256?, onProgress? })` returns a structured report. Chromium is the only runner currently supported. Other browser engines are not declared compatible.

`await writeReport(report, directory)` writes `report.json`, `index.html`, `summary.md`. Reusing a report directory overwrites those three files. Reports contain titles, bounded errors, counters, timings, verdicts, versions and optional entry-file hash, not request payloads. Custom messages are not guaranteed secret-free.

`runSuite` uses the same browser process but a fresh browser context per trial. It is sequential. There is no automatic sharding, backend rollback, tracing, screenshot capture, source mutation, equivalence solving or statistical confidence estimation.
