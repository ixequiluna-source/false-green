import { randomBytes } from 'node:crypto';
import type { BrowserContext, Route, Page } from 'playwright-core';
import type { Mutation } from './types.js';

export interface Evidence { hits: number; blockedRequests: number; errors: string[]; activate?: (page: Page) => Promise<void> }
export function matchesRequest(m: Mutation, url: URL, method: string): boolean {
  return 'path' in m && m.path === url.pathname && (!('method' in m) || !m.method || m.method === method);
}

/** One exact-origin router for guard + mutation; no request payloads are collected. */
export async function installInjector(context: BrowserContext, mutation: Mutation | null, origins: string[]): Promise<Evidence> {
  const evidence: Evidence = { hits: 0, blockedRequests: 0, errors: [] };
  const hit = () => { evidence.hits = Math.min(10_000, evidence.hits + 1); };
  const fail = (message: string) => { if (evidence.errors.length < 5) evidence.errors.push(message.slice(0, 400)); };
  await context.route('**/*', async (route: Route) => {
    try {
      const request = route.request();
      const url = new URL(request.url());
      if (!origins.includes(url.origin)) { evidence.blockedRequests++; await route.abort('blockedbyclient'); return; }
      if (mutation && matchesRequest(mutation, url, request.method())) {
        if (mutation.kind === 'route-abort') { await route.abort('failed'); hit(); return; }
        if (mutation.kind === 'break-image' && request.resourceType() === 'image') {
          await route.fulfill({ status: 200, contentType: 'image/png', body: 'false-green: intentionally invalid image bytes' }); hit(); return;
        }
        if (mutation.kind === 'route-response') {
          await route.fulfill({ status: mutation.status, contentType: mutation.contentType ?? 'application/json', body: mutation.body }); hit(); return;
        }
      }
      await route.continue();
    } catch {
      fail('Request interception failed; the effect cannot be attributed.');
      try { await route.abort('failed'); } catch { /* The browser/context may already be closed. */ }
    }
  });
  // No injected script in clean controls: only the same network guard is installed.
  if (!mutation || !('selector' in mutation)) return evidence;
  const binding = `__falseGreen_${randomBytes(12).toString('hex')}`;
  await context.exposeBinding(binding, (_source, event: unknown) => {
    if (event === 'hit') hit();
    else if (typeof event === 'string') fail(event);
  });
  const bootstrap = ({ m, bindingName, allowed, allowBlank }: { m: Mutation; bindingName: string; allowed: string[]; allowBlank: boolean }) => {
    if ((!allowed.includes(location.origin) && !(allowBlank && location.href === 'about:blank')) || !('selector' in m)) return;
    const runtime = globalThis as unknown as Record<string, (event: string) => Promise<void>>;
    const emit = (event: string) => { void runtime[bindingName]?.(event).catch(() => undefined); };
    let valid = true;
    try { document.querySelector(m.selector); } catch { valid = false; emit('Invalid CSS selector; the mutation was not installed.'); }
    if (!valid) return;
    if (m.kind === 'block-click') {
      window.addEventListener('click', (event) => {
        const target = event.composedPath().find(x => x instanceof Element && x.matches(m.selector));
        if (target) { event.preventDefault(); event.stopImmediatePropagation(); emit('hit'); }
      }, true);
      return;
    }
    const apply = () => {
      try {
        document.querySelectorAll(m.selector).forEach(element => {
          if (m.kind === 'replace-text' && element.textContent !== m.value) { element.textContent = m.value; emit('hit'); }
          if (m.kind === 'hide-element' && element instanceof HTMLElement && element.style.getPropertyValue('display') !== 'none') {
            element.style.setProperty('display', 'none', 'important'); emit('hit');
          }
          if (m.kind === 'break-image' && element instanceof HTMLImageElement && element.getAttribute('src') !== 'data:image/png;base64,AA==') {
            element.removeAttribute('srcset');
            element.setAttribute('src', 'data:image/png;base64,AA=='); emit('hit');
          }
          if (m.kind === 'remove-attribute' && element.hasAttribute(m.attribute)) { element.removeAttribute(m.attribute); emit('hit'); }
        });
      } catch { emit('DOM mutation failed; inspect selector and page behavior.'); }
    };
    new MutationObserver(apply).observe(document, { childList: true, subtree: true, attributes: true, characterData: true });
    apply();
  };
  await context.addInitScript(bootstrap, { m: mutation, bindingName: binding, allowed: origins, allowBlank: false });
  evidence.activate = async (page: Page) => {
    if (page.url() !== 'about:blank') throw new Error('Offline DOM activation requires an about:blank document.');
    await page.evaluate(bootstrap, { m: mutation, bindingName: binding, allowed: origins, allowBlank: true });
  };
  return evidence;
}
