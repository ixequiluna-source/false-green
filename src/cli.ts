#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { defineSuite } from './config.js';
import { runSuite, VERSION } from './runner.js';
import { writeReport, renderMarkdown } from './report.js';
import type { Suite } from './types.js';

const help = `false-green ${VERSION}
Break the product. Challenge the green.

Usage: false-green --suite ./false-green.suite.mjs [options]

  --suite PATH          Trusted JavaScript ESM suite (required).
  --out PATH            Report directory (default false-green-report).
  --scenario ID         Run one scenario by exact id.
  --headed              Show Chromium.
  --version             Print version.
  --help                Print this help.

Environment: FALSE_GREEN_CHROMIUM_PATH for an installed Chromium executable.
Exit codes: 0 all detected; 1 stable survivors; 2 invalid/incomplete/error.
This executes trusted local code. Use disposable, authorized targets only.
`;
export async function main(args = process.argv.slice(2)): Promise<number> {
  try {
    const { values } = parseArgs({ args, options: {
      suite: { type: 'string' }, out: { type: 'string' }, scenario: { type: 'string' },
      headed: { type: 'boolean' }, version: { type: 'boolean' }, help: { type: 'boolean' },
    }, allowPositionals: false, strict: true });
    if (values.help) { console.log(help); return 0; }
    if (values.version) { console.log(VERSION); return 0; }
    if (!values.suite) throw new Error('Missing --suite. Run false-green --help.');
    const file = resolve(values.suite);
    const source = await readFile(file);
    const loaded = await import(pathToFileURL(file).href) as { default?: Suite };
    if (!loaded.default) throw new Error('Suite must have a default export.');
    const suite = defineSuite(loaded.default);
    if (values.scenario) {
      const selected = suite.scenarios.filter(s => s.id === values.scenario);
      if (!selected.length) throw new Error(`Unknown scenario: ${values.scenario}`);
      suite.scenarios = selected;
    }
    const executablePath = process.env['FALSE_GREEN_CHROMIUM_PATH'];
    const report = await runSuite(suite, { headless: !values.headed,
      suiteFileSha256: createHash('sha256').update(source).digest('hex'),
      ...(executablePath ? { executablePath } : {}),
      onProgress: message => console.error(`  ${message}`) });
    const output = await writeReport(report, values.out ?? 'false-green-report');
    console.log(renderMarkdown(report));
    console.log(`Reports: ${output}`);
    return report.summary.exitCode;
  } catch (error) {
    console.error(`false-green: ${error instanceof Error ? error.message : 'unexpected error'}`);
    return 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await main();
}
