import { readFileSync } from 'node:fs';
import { defineSuite, check, eventually } from '../../dist/index.js';

const mutations = [
  { id: 'dead-checkout', title: 'Checkout button does nothing', kind: 'block-click', selector: '#checkout' },
  { id: 'broken-image', title: 'Product image cannot decode', kind: 'break-image', selector: '#product-image' },
  { id: 'hidden-shipping', title: 'Shipping information is invisible', kind: 'hide-element', selector: '#shipping' },
  { id: 'wrong-confirmation', title: 'Confirmation copy is corrupted', kind: 'replace-text', selector: '#confirmation', value: 'Payment rejected.' },
  { id: 'missing-accessible-name', title: 'Explicit button label is removed', kind: 'remove-attribute', selector: '#checkout', attribute: 'aria-label' },
];
async function exercise({page}) {
  await page.locator('#checkout').click();
}
async function weakVerify({page}) {
  // Intentionally weak: existence, not behavior; `complete`, not decoded pixels.
  check(await page.locator('#checkout').count() === 1, 'checkout exists');
  check(await page.locator('#total').count() === 1, 'price exists');
  check(await page.locator('#confirmation').count() === 1, 'confirmation exists');
  check(await page.locator('#shipping').count() === 1, 'shipping exists');
  check(await page.locator('#product-image').evaluate(img => img.complete), 'image completed a load attempt');
}
async function strongVerify({page, signal}) {
  const opts = { timeoutMs: 450, signal };
  await eventually(() => page.locator('#confirmation').isVisible(), 'Checkout must show a confirmation', opts);
  check(await page.locator('#confirmation').textContent() === 'Order confirmed.', 'Confirmation must communicate success');
  check(await page.locator('#total').textContent() === '$49.00', 'Displayed total must match the expected fixture total');
  check(await page.locator('#product-image').evaluate(img => img.complete && img.naturalWidth > 0), 'Product image must contain decoded pixels');
  check(await page.locator('#shipping').isVisible(), 'Shipping information must remain visible');
  // This checks a declared explicit-label contract, not a full accessibility audit.
  check(await page.locator('#checkout').getAttribute('aria-label') === 'Complete demo order', 'Explicit accessible label must match the product contract');
}
export function createDemoSuite() {
  const html = readFileSync(new URL('./offline.html', import.meta.url), 'utf8');
  return defineSuite({ name: 'One checkout. Two very different test suites.', baseURL: 'about:blank', html, repetitions: 2, timeoutMs: 7000,
    scenarios: [
      { id: 'weak-checkout', title: 'Weak checks: everything is still green', exercise, verify: weakVerify, mutations },
      { id: 'strong-checkout', title: 'Behavior checks: the same faults are detected', exercise, verify: strongVerify, mutations },
    ] });
}
export default createDemoSuite();
