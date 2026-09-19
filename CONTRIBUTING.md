# Contributing

Start with a reproducer. Keep fault injection, activation evidence and verdict interpretation separately testable.

Run `npm run verify`. When local HTTP navigation is permitted, also run `npm run test:http`. Submit the exact runtime/browser versions and command output; do not label blocked or skipped checks as passes.

For an operator, include: a healthy fixture; actual changed behavior; a strong check that notices; a weak check that misses; a no-hit case; cleanup/isolation; an explanation of equivalent behavior and unsupported DOM/network cases.

For verdict changes, add a truth-table regression before implementation. Do not silently turn timeouts, zero hits or environment errors into successful detections.

Use synthetic fixtures. Never upload client code, production secrets, medical records, access tokens or proprietary reports. Keep changes small, clearly described and reviewable. Treat other contributors respectfully; critiques should address code and evidence, not people.

This alpha uses strict TypeScript and Node's built-in test runner. Avoid dependencies for small utility functions. Update both README versions when changing the public behavior.
