import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext } from 'playwright-core';
import { defineSuite } from './config.js';
import { isAssertionFailure } from './assertions.js';
import { installInjector } from './injector.js';
import { classify, cleanBaseline, summarize } from './verdict.js';
import type { Mutation, Report, ResolvedSuite, Scenario, ScenarioResult, Suite, Trial, ResetContext } from './types.js';

export const VERSION = '0.1.0-alpha.1';
class DeadlineError extends Error { constructor() { super('Trial exceeded its total timeout.'); this.name = 'DeadlineError'; } }
export interface RunOptions {
  executablePath?: string;
  headless?: boolean;
  suiteFileSha256?: string;
  onProgress?: (message: string) => void;
}
function safeMessage(error: unknown): string {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : 'Non-Error value thrown by trusted suite code.';
  // Best effort only. Do not treat this as a data-loss-prevention system.
  return message.replace(/(https?:\/\/[^\s?#]+)[?#][^\s]*/g, '$1?[redacted]').slice(0, 1200);
}
export async function runTrial(browser: Browser, suite: ResolvedSuite, scenario: Scenario, mutation: Mutation | null, metadata: Omit<ResetContext, 'signal'>): Promise<Trial> {
  const started = performance.now();
  const controller = new AbortController();
  let context: BrowserContext | undefined;
  let phase: Trial['phase'] = 'setup';
  const currentPhase = (): Trial['phase'] => phase;
  let outcome: Trial['outcome'] = 'passed';
  let message: string | null = null;
  let evidence = { hits: 0, blockedRequests: 0, errors: [] as string[] };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new DeadlineError()); }, suite.timeoutMs);
  });
  const work = async () => {
    await suite.reset?.({ ...metadata, signal: controller.signal });
    controller.signal.throwIfAborted();
    context = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: false });
    // A late newContext resolution after the deadline still gets closed.
    if (controller.signal.aborted) { await context.close(); controller.signal.throwIfAborted(); }
    const installed = await installInjector(context, mutation, suite.allowedOrigins);
    evidence = installed;
    const page = await context.newPage();
    page.setDefaultTimeout(Math.max(100, Math.min(3000, suite.timeoutMs - 50)));
    page.setDefaultNavigationTimeout(Math.max(100, Math.min(5000, suite.timeoutMs - 50)));
    if (suite.html !== undefined) { await page.setContent(suite.html); await installed.activate?.(page); }
    const input = { page, baseURL: suite.baseURL, signal: controller.signal };
    phase = 'exercise';
    await scenario.exercise(input);
    controller.signal.throwIfAborted();
    phase = 'verify';
    await scenario.verify(input);
    controller.signal.throwIfAborted();
    phase = 'complete';
  };
  try { await Promise.race([work(), deadline]); }
  catch (error) {
    outcome = error instanceof DeadlineError ? 'timeout' : currentPhase() === 'verify' && isAssertionFailure(error) ? 'assertion-failed' : 'error';
    message = safeMessage(error);
  } finally {
    if (timer) clearTimeout(timer);
    controller.abort();
    if (context) {
      // Give already-issued binding calls a protocol round-trip before collecting evidence.
      for (const page of context.pages()) {
        if (!page.isClosed()) {
          try { await Promise.race([page.evaluate(() => true), new Promise(resolve => setTimeout(resolve, 100))]); } catch { /* Closed by a timed-out journey. */ }
        }
      }
      try { await context.close(); } catch { outcome = 'error'; message = 'Browser context cleanup failed.'; }
    }
  }
  return { outcome, phase, hits: evidence.hits, durationMs: Math.round(performance.now() - started), message, blockedRequests: evidence.blockedRequests, injectionErrors: evidence.errors };
}

export async function runSuite(input: Suite, options: RunOptions = {}): Promise<Report> {
  const suite = defineSuite(input);
  const started = performance.now();
  const browser = await chromium.launch({ headless: options.headless ?? true,
    ...(options.executablePath ? { executablePath: options.executablePath } : {}) });
  const scenarios: ScenarioResult[] = [];
  const require = createRequire(import.meta.url);
  try {
    for (const scenario of suite.scenarios) {
      const before: Trial[] = [], after: Trial[] = [];
      options.onProgress?.(`${scenario.id}: clean controls (${suite.repetitions})`);
      for (let i = 0; i < suite.repetitions; i++) before.push(await runTrial(browser, suite, scenario, null,
        { scenarioId: scenario.id, mutationId: null, trial: i + 1, phase: 'before' }));
      const mutations = [] as ScenarioResult['mutations'];
      for (const mutation of scenario.mutations) {
        const trials: Trial[] = [];
        if (cleanBaseline(before)) {
          options.onProgress?.(`${scenario.id} / ${mutation.id}: applying fault (${suite.repetitions})`);
          for (let i = 0; i < suite.repetitions; i++) trials.push(await runTrial(browser, suite, scenario, mutation,
            { scenarioId: scenario.id, mutationId: mutation.id, trial: i + 1, phase: 'mutation' }));
        }
        mutations.push({ id: mutation.id, title: mutation.title, kind: mutation.kind, trials, ...classify(trials, cleanBaseline(before)) });
      }
      if (cleanBaseline(before)) {
        options.onProgress?.(`${scenario.id}: post-mutation clean controls (${suite.repetitions})`);
        for (let i = 0; i < suite.repetitions; i++) after.push(await runTrial(browser, suite, scenario, null,
          { scenarioId: scenario.id, mutationId: null, trial: i + 1, phase: 'after' }));
      }
      const baselineValid = cleanBaseline(before) && cleanBaseline(after);
      for (const result of mutations) Object.assign(result, classify(result.trials, baselineValid));
      scenarios.push({ id: scenario.id, title: scenario.title, baselineBefore: before, baselineAfter: after, baselineValid, mutations });
    }
    return { schemaVersion: 1, toolVersion: VERSION, suite: suite.name, createdAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - started), environment: { node: process.version, platform: process.platform,
        browser: browser.version(), playwright: (require('playwright-core/package.json') as {version: string}).version },
      repetitions: suite.repetitions, suiteFileSha256: options.suiteFileSha256 ?? null, scenarios, summary: summarize(scenarios) };
  } finally { await browser.close(); }
}
