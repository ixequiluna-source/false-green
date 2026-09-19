# false-green · One checkout. Two very different test suites.

5 detected · 5 survived · 0 not exercised · 0 unresolved

Detection rate: 50% (10/10 eligible). Exit code: 1.

| Scenario | Fault | Verdict | Hits per repetition |
|---|---|---|---|
| weak-checkout | dead-checkout | survived | 1, 1 |
| weak-checkout | broken-image | survived | 1, 1 |
| weak-checkout | hidden-shipping | survived | 1, 1 |
| weak-checkout | wrong-confirmation | survived | 1, 1 |
| weak-checkout | missing-accessible-name | survived | 1, 1 |
| strong-checkout | dead-checkout | detected | 1, 1 |
| strong-checkout | broken-image | detected | 1, 1 |
| strong-checkout | hidden-shipping | detected | 1, 1 |
| strong-checkout | wrong-confirmation | detected | 1, 1 |
| strong-checkout | missing-accessible-name | detected | 1, 1 |

A detected fault is not proof of product correctness. A survivor needs review for relevance or equivalent behavior. Unexercised and unresolved results never improve the score.
