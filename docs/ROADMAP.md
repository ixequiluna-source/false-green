# Roadmap

No dates or completed status are implied by unchecked items.

## Shipped in this source alpha

- [x] Typed scenario runner and CLI.
- [x] Clean pre/post controls and repeated fault trials.
- [x] Actual activation counters and six conservative verdicts.
- [x] Seven operator kinds and an offline real-browser demonstration.
- [x] Standalone HTML, JSON and Markdown reports.
- [x] English/Spanish README, unit tests and browser test suites.

## Next acceptance gates

- [ ] Run the declared dependency versions from a clean npm installation, commit a generated lockfile, and record the hosted CI run URL/SHA.
- [ ] Complete HTTP integration on an environment permitting local HTTP navigation.
- [ ] Introduce a native `@playwright/test` fixture + reporter adapter without rewriting existing assertion semantics.
- [ ] Add per-test identity alignment, skipped-test handling and explicit flaky/retry treatment in that adapter.
- [ ] Add bounded assertions-per-scenario instrumentation to expose empty verification functions explicitly.
- [ ] Add traces/screenshot opt-in with redaction guidance, never automatic publication.
- [ ] Support Firefox/WebKit only after independent compatibility tests.
- [ ] Verify operator relevance against a second, unrelated real application with authorized disposable data.
- [ ] Validate package naming and publish an npm prerelease through an owner-controlled release process.

## First external contribution candidates

1. A minimal reproduction for an equivalent or unexercised fault.
2. A responsive-image fixture with a documented supported boundary.
3. A test for an additional attribution failure, such as an iframe detaching during verification.

Do not add operators just to enlarge the catalog. Every operator needs positive controls, no-hit controls, isolation checks, and a clear evidence definition.
