import type { Page } from 'playwright-core';

export type Mutation = { id: string; title: string } & (
  | { kind: 'block-click'; selector: string }
  | { kind: 'replace-text'; selector: string; value: string }
  | { kind: 'hide-element'; selector: string }
  | { kind: 'remove-attribute'; selector: string; attribute: string }
  | { kind: 'route-response'; path: string; method?: string; status: number; body: string; contentType?: string }
  | { kind: 'route-abort'; path: string; method?: string }
  | { kind: 'break-image'; path: string }
  | { kind: 'break-image'; selector: string }
);

export interface TrialContext {
  page: Page;
  baseURL: string;
  /** Cooperative cancellation. User-provided Node code is trusted, not sandboxed. */
  signal: AbortSignal;
}

export interface ResetContext {
  scenarioId: string;
  mutationId: string | null;
  trial: number;
  phase: 'before' | 'mutation' | 'after';
  signal: AbortSignal;
}

export interface Scenario {
  id: string;
  title: string;
  /** A healthy user journey. Errors here are inconclusive, not mutation kills. */
  exercise: (context: TrialContext) => Promise<void>;
  /** Only assertion failures here qualify as detection. */
  verify: (context: TrialContext) => Promise<void>;
  mutations: Mutation[];
}

export interface Suite {
  name: string;
  baseURL: string;
  /** Offline fixture mode: baseURL must be about:blank. Browser HTTP(S) is blocked. */
  html?: string;
  /** Exact origins allowed through this browser context. Defaults to baseURL's origin. */
  allowedOrigins?: string[];
  /** Explicit opt-in for non-loopback targets. Use only authorized disposable staging. */
  allowRemoteTargets?: boolean;
  repetitions?: number;
  timeoutMs?: number;
  scenarios: Scenario[];
  /** Reset external/backend state BEFORE EVERY trial, including clean controls. */
  reset?: (context: ResetContext) => Promise<void>;
}

export interface ResolvedSuite extends Suite {
  allowedOrigins: string[];
  repetitions: number;
  timeoutMs: number;
}

export type TrialOutcome = 'passed' | 'assertion-failed' | 'error' | 'timeout';
export interface Trial {
  outcome: TrialOutcome;
  phase: 'setup' | 'exercise' | 'verify' | 'complete';
  hits: number;
  durationMs: number;
  message: string | null;
  /** Counts only: no request bodies, cookies, or URL query strings are collected. */
  blockedRequests: number;
  injectionErrors: string[];
}
export type Verdict = 'detected' | 'survived' | 'not-exercised' | 'unstable' | 'inconclusive' | 'baseline-invalid';
export interface MutationResult {
  id: string;
  title: string;
  kind: Mutation['kind'];
  verdict: Verdict;
  reason: string;
  trials: Trial[];
}
export interface ScenarioResult {
  id: string;
  title: string;
  baselineBefore: Trial[];
  baselineAfter: Trial[];
  baselineValid: boolean;
  mutations: MutationResult[];
}
export interface Summary {
  total: number;
  detected: number;
  survived: number;
  unexercised: number;
  unresolved: number;
  eligible: number;
  detectionRate: number | null;
  /** 0: all detected; 1: stable survivors; 2: invalid/incomplete experiment. */
  exitCode: 0 | 1 | 2;
}
export interface Report {
  schemaVersion: 1;
  toolVersion: string;
  suite: string;
  createdAt: string;
  durationMs: number;
  environment: { node: string; platform: string; browser: string; playwright: string };
  repetitions: number;
  suiteFileSha256: string | null;
  scenarios: ScenarioResult[];
  summary: Summary;
}
