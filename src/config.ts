import type { Mutation, ResolvedSuite, Suite } from './types.js';

const idPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;
function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid false-green suite: ${message}`);
}
function integer(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
export function isLoopback(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '[::1]'].includes(hostname.toLowerCase());
}
export function validateMutation(m: Mutation): void {
  ensure(m && typeof m === 'object', 'mutation must be an object');
  ensure(typeof m.id === 'string' && idPattern.test(m.id), 'mutation id must be a lowercase slug (1–80 chars)');
  ensure(typeof m.title === 'string' && m.title.trim().length > 0, `${m.id}: title is required`);
  const domKinds = ['block-click', 'replace-text', 'hide-element', 'remove-attribute'];
  const networkKinds = ['route-response', 'route-abort', 'break-image'];
  ensure([...domKinds, ...networkKinds].includes(m.kind), `${m.id}: unknown mutation kind`);
  if (domKinds.includes(m.kind)) ensure('selector' in m, `${m.id}: selector is required`);
  if (networkKinds.includes(m.kind) && m.kind !== 'break-image') ensure('path' in m, `${m.id}: path is required`);
  if (m.kind === 'break-image') ensure(('path' in m) !== ('selector' in m), `${m.id}: provide exactly one image path or selector`);
  if ('selector' in m) ensure(typeof m.selector === 'string' && m.selector.trim().length > 0, `${m.id}: selector is required`);
  if ('path' in m) {
    ensure(typeof m.path === 'string' && m.path.startsWith('/') && !m.path.startsWith('//'), `${m.id}: path must be an exact URL pathname starting with /`);
    ensure(!/[?#*]/.test(m.path), `${m.id}: query strings, fragments and globs are not supported`);
  }
  if ('method' in m && m.method !== undefined) ensure(/^[A-Z]+$/.test(m.method), `${m.id}: method must be uppercase`);
  if (m.kind === 'route-response') {
    ensure(integer(m.status, 200, 599), `${m.id}: status must be 200–599`);
    ensure(typeof m.body === 'string', `${m.id}: body must be a string`);
    ensure(![204, 205, 304].includes(m.status) || m.body === '', `${m.id}: this status requires an empty body`);
  }
  if (m.kind === 'replace-text') ensure(typeof m.value === 'string', `${m.id}: replacement value must be a string`);
  if (m.kind === 'remove-attribute') ensure(typeof m.attribute === 'string' && /^[a-zA-Z_:][a-zA-Z0-9_:.-]*$/.test(m.attribute), `${m.id}: invalid attribute name`);
}
export function defineSuite(input: Suite): ResolvedSuite {
  ensure(input && typeof input === 'object', 'export a suite object');
  ensure(typeof input.name === 'string' && input.name.trim().length > 0, 'name is required');
  ensure(typeof input.baseURL === 'string', 'baseURL is required');
  const offline = input.html !== undefined;
  ensure(!offline || (typeof input.html === 'string' && input.html.length > 0 && input.baseURL === 'about:blank'), 'HTML fixtures require nonempty html and baseURL: about:blank');
  const base = new URL(input.baseURL);
  ensure(offline || ['http:', 'https:'].includes(base.protocol), 'baseURL must use http(s)');
  ensure(!base.username && !base.password, 'credentials in baseURL are not allowed');
  ensure(!base.search && !base.hash, 'baseURL may not contain a query or fragment');
  const allowedOrigins = input.allowedOrigins ?? (offline ? [] : [base.origin]);
  ensure(!offline || allowedOrigins.length === 0, 'HTML fixtures cannot allow network origins');
  ensure(Array.isArray(allowedOrigins) && (offline || allowedOrigins.length > 0), 'allowedOrigins must not be empty');
  for (const origin of allowedOrigins) {
    const u = new URL(origin);
    ensure(['http:', 'https:'].includes(u.protocol) && u.origin === origin, 'allowedOrigins must contain exact http(s) origins, without paths');
    ensure(input.allowRemoteTargets === true || isLoopback(u.hostname), 'remote targets require allowRemoteTargets: true');
  }
  ensure(offline || allowedOrigins.includes(base.origin), 'baseURL origin must be allowed');
  const repetitions = input.repetitions ?? 2;
  const timeoutMs = input.timeoutMs ?? 10_000;
  ensure(integer(repetitions, 2, 10), 'repetitions must be an integer from 2 to 10');
  ensure(integer(timeoutMs, 100, 300_000), 'timeoutMs must be 100–300000');
  ensure(Array.isArray(input.scenarios) && input.scenarios.length > 0, 'at least one scenario is required');
  ensure(input.reset === undefined || typeof input.reset === 'function', 'reset must be a function');
  const scenarios = new Set<string>();
  for (const s of input.scenarios) {
    ensure(s && typeof s === 'object' && typeof s.id === 'string' && idPattern.test(s.id), 'scenario id must be a lowercase slug');
    ensure(!scenarios.has(s.id), `duplicate scenario id: ${s.id}`); scenarios.add(s.id);
    ensure(typeof s.title === 'string' && s.title.trim().length > 0, `${s.id}: title is required`);
    ensure(typeof s.exercise === 'function' && typeof s.verify === 'function', `${s.id}: exercise and verify must be functions`);
    ensure(Array.isArray(s.mutations) && s.mutations.length > 0, `${s.id}: at least one mutation is required`);
    const ids = new Set<string>();
    for (const m of s.mutations) { validateMutation(m); ensure(!offline || !('path' in m), `${m.id}: URL-path faults require an HTTP fixture, not html`); ensure(!ids.has(m.id), `${s.id}: duplicate mutation id ${m.id}`); ids.add(m.id); }
  }
  return { ...input, allowedOrigins: [...new Set(allowedOrigins)], repetitions, timeoutMs };
}
