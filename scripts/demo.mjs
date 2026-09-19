import assert from 'node:assert/strict';
import { createDemoSuite } from '../examples/shop/suite.mjs';
import { runSuite, writeReport, renderMarkdown } from '../dist/index.js';

const run = async () => {
  const executablePath = process.env.FALSE_GREEN_CHROMIUM_PATH;
  const suite = createDemoSuite();
  const report = await runSuite(suite, { ...(executablePath ? {executablePath} : {}), onProgress: console.log });
  await writeReport(report, 'false-green-report');
  // A mutation campaign that finds survivors returns 1. The DEMO succeeds only
  // when it proves the exact documented contrast; never blindly swallow exit 1.
  assert.equal(report.summary.exitCode, 1);
  assert.equal(report.summary.survived, 5);
  assert.equal(report.summary.detected, 5);
  assert.equal(report.summary.unresolved, 0);
  assert.equal(report.summary.unexercised, 0);
  assert.ok(report.scenarios.every(s => s.baselineValid));
  assert.ok(report.scenarios[0].mutations.every(m => m.verdict === 'survived'));
  assert.ok(report.scenarios[1].mutations.every(m => m.verdict === 'detected'));
  console.log('\n'+renderMarkdown(report));
  console.log('DEMO VERIFIED: 5 stable false greens, 5 detections, all clean controls passed.');
  console.log('Open false-green-report/index.html for the evidence report.');
};
await run();
