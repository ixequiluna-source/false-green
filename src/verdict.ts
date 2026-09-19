import type { MutationResult, ScenarioResult, Summary, Trial, Verdict } from './types.js';

export function cleanBaseline(trials: Trial[]): boolean {
  return trials.length >= 2 && trials.every(t => t.outcome === 'passed' && t.hits === 0 && t.blockedRequests === 0 && t.injectionErrors.length === 0);
}
export function classify(trials: Trial[], baselineValid: boolean): Pick<MutationResult, 'verdict' | 'reason'> {
  const result = (verdict: Verdict, reason: string) => ({ verdict, reason });
  if (!baselineValid) return result('baseline-invalid', 'Clean controls did not pass consistently. No mutation score is justified.');
  if (trials.length < 2) return result('inconclusive', 'At least two independent mutation trials are required.');
  if (trials.some(t => t.blockedRequests > 0 || t.injectionErrors.length > 0 || ['error', 'timeout'].includes(t.outcome))) {
    return result('inconclusive', 'A journey, environment, timeout or injector error prevents attribution.');
  }
  if (trials.every(t => t.hits === 0)) return result('not-exercised', 'The fault was armed but no application was observed. This is not a survivor.');
  if (trials.some(t => t.hits === 0)) return result('unstable', 'The fault did not apply in every repetition.');
  if (trials.every(t => t.outcome === 'passed')) return result('survived', 'The fault applied in every repetition; all verification checks still passed. Review the test and fault relevance.');
  if (trials.every(t => t.outcome === 'assertion-failed' && t.phase === 'verify')) return result('detected', 'An assertion failed during verification after the fault applied in every repetition.');
  return result('unstable', 'Repetitions disagree. Do not treat this result as a confirmed kill or survivor.');
}
export function summarize(scenarios: ScenarioResult[]): Summary {
  const mutations = scenarios.flatMap(s => s.mutations);
  const count = (v: Verdict) => mutations.filter(m => m.verdict === v).length;
  const detected = count('detected'), survived = count('survived'), unexercised = count('not-exercised');
  const unresolved = mutations.length - detected - survived - unexercised;
  const eligible = detected + survived;
  const incomplete = scenarios.length === 0 || scenarios.some(s => !s.baselineValid) || mutations.length === 0 || unexercised > 0 || unresolved > 0;
  return { total: mutations.length, detected, survived, unexercised, unresolved, eligible,
    detectionRate: eligible ? Number((100 * detected / eligible).toFixed(2)) : null,
    exitCode: incomplete ? 2 : survived ? 1 : 0 };
}
