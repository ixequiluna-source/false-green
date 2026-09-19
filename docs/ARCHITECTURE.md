# Architecture and interpretation

```text
trusted suite module
       |
strict validation -- rejects ambiguous targets / repetitions / missing contracts
       |
Chromium
       |
scenario: clean controls x N
       |
       +-- invalid? mark baseline-invalid; do not run mutations
       |
       +-- each fault x N, fresh context each time
       |      reset -> guard -> page -> injector -> exercise -> verify -> close
       |                           |                       |
       |                           +--- activation --------+
       |
scenario: clean controls x N after mutations
       |
classify -> summarize -> HTML / JSON / Markdown / CLI exit
```

## Decisions

**A failure is not automatically a kill.** Errors in setup or exercise, generic exceptions, timeouts and injector failures stay inconclusive. Only native assertion failures during the verify phase are credited after consistent activation.

**Armed is not applied.** DOM faults report a performed change or intercepted click. Network faults report an actual fulfill/abort operation. No application means `not-exercised`. This guards against misspelled selectors, unmatched paths and unvisited features silently creating impressive scores.

**Context isolation is not backend isolation.** The runner creates a fresh browser context for every run and blocks service workers. Callers provide `reset` for database or external state. Reset errors invalidate interpretation.

**The last clean run matters.** A passing baseline at the start can hide contamination or later environment failure. Post-controls must pass too. Their failure retrospectively invalidates all mutations for the scenario.

**Conservative does not mean causally proven.** The sequence is not randomized and two repetitions are not a statistical study. Identical generic assertion outcomes need not have identical root causes. Reports support diagnosis; they do not prove universal test adequacy.

**No LLM in the scoring path.** Verdicts are pure functions over observed run records. They can be tested independently of the browser.

## Threat and fidelity boundaries

The JavaScript suite is trusted executable code, not a data-only config. Browser routing covers context-interceptable requests, not all host network traffic. DOM injection has blind spots in shadow roots, responsive media, custom events and self-modifying applications. The entry hash does not seal dependencies or the server's built artifact.

The default demo uses an offline HTML fixture because the demonstration concerns browser behavior, not server persistence. A separate HTTP fixture exercises network integration. Neither is a production shop.
