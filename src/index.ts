export { defineSuite, validateMutation } from './config.js';
export { check, eventually } from './assertions.js';
export { runSuite, VERSION } from './runner.js';
export { writeReport, renderHtml, renderMarkdown } from './report.js';
export { classify, cleanBaseline, summarize } from './verdict.js';
export type { Suite, Scenario, Mutation, Report, Trial, Verdict, Summary, TrialContext } from './types.js';
export type { RunOptions } from './runner.js';
