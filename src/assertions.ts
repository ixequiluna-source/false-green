import { AssertionError } from 'node:assert';
import { setTimeout as sleep } from 'node:timers/promises';

/** Use Node's native AssertionError so the runner can separate checks from crashes. */
export function check(value: unknown, message: string): asserts value {
  if (!value) throw new AssertionError({ message, actual: Boolean(value), expected: true, operator: 'false-green.check' });
}
/** Poll a predicate. Predicate errors propagate as infrastructure errors, not detections. */
export async function eventually(
  predicate: () => boolean | Promise<boolean>,
  message: string,
  options: { timeoutMs?: number; intervalMs?: number; signal?: AbortSignal } = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 1500;
  const intervalMs = options.intervalMs ?? 25;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new TypeError('eventually requires positive finite timeoutMs and intervalMs');
  }
  const deadline = performance.now() + timeoutMs;
  do {
    options.signal?.throwIfAborted();
    if (await predicate()) return;
    if (performance.now() >= deadline) break;
    await sleep(Math.min(intervalMs, Math.max(1, deadline - performance.now())), undefined,
      options.signal ? { signal: options.signal } : {});
  } while (performance.now() <= deadline);
  check(false, message);
}
export function isAssertionFailure(error: unknown): boolean {
  return error instanceof AssertionError;
}
