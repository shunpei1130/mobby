import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'htmlparser2';
import { findAll, textContent } from 'domutils';
import checkout from '../api/gacha-checkout-session.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const document = parseDocument(html);
const all = findAll((node) => node.type === 'tag' || node.type === 'script', document.children);
const id = (value) => all.find((node) => node.attribs?.id === value);
const page = all.find((node) => node.attribs?.class === 'journey-page');
assert(page, 'New homepage exists');
assert.equal(all.filter((node) => node.name === 'h1').length, 1, 'One page heading');
assert(id('mobidou') && id('diagnosis'), 'Navigation anchors resolve');
assert(!all.some((node) => (node.attribs?.class || '').split(/\s+/).some((name) => name === 'journey-app' || name === 'journey-about')), 'Redundant lower sections removed');
assert(id('splash-screen'), 'Original opening exists');
assert(id('splash-screen').attribs.role === 'button' && id('splash-screen').attribs.tabindex === '0', 'Opening supports tap and keyboard');
assert(html.includes('new URLSearchParams(window.location.search).get("skipSplash")'), 'Opening is shown by default with an explicit preview bypass');
assert(!/href=["'][^"']*gacha\//.test(html), 'No retired gacha promotion remains on homepage');
const ids = all.filter((node) => node.attribs?.id).map((node) => node.attribs.id);
assert.equal(ids.length, new Set(ids).size, 'No duplicate element IDs');
for (const target of ['homeOpenDiagnosis', 'homePosterAction', 'homeOpenEncyclopedia', 'homeOpenFaq', 'homeOpenSns']) {
  assert(id(target), `Existing menu ${target} preserved`);
}
for (const node of findAll((node) => node.attribs?.src || node.attribs?.href, [page])) {
  const url = node.attribs.src || node.attribs.href;
  if (/^(?:https?:|mailto:|#|\/)/.test(url)) continue;
  assert(fs.existsSync(path.resolve(root, decodeURIComponent(url.split('?')[0]))), `Resource exists: ${url}`);
}
for (const button of all.filter((node) => node.attribs?.['data-journey-popup'])) {
  assert(id(button.attribs['data-journey-popup']), 'Popup target exists');
}
for (const script of all.filter((node) => node.type === 'script' && !node.attribs.src)) {
  const source = textContent(script);
  if (script.attribs.type === 'application/ld+json') JSON.parse(source);
  else new vm.Script(source);
}
for (const name of ['assets/mobidou-home.js', 'shared/diagnosis-followup.js', 'gacha/retired.js', 'gacha/spin.js']) {
  new vm.Script(fs.readFileSync(path.join(root, name), 'utf8'));
}
console.log('PASS: homepage anchors, six existing menu destinations, resources, popup targets and script syntax');

for (const [method, expected] of [['POST', 410], ['GET', 405], ['OPTIONS', 200]]) {
  const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(value) { this.value = value; return this; }, end() { return this; } };
  await checkout({ method, body: {} }, res);
  assert.equal(res.code, expected);
  if (method === 'POST') assert.equal(res.value.code, 'STICKER_GACHA_RETIRED');
}
const spinSource = fs.readFileSync(path.join(root, 'gacha/spin.js'), 'utf8');
for (const mode of ['', '?mode=free', '?mode=test', '?code=OLD']) {
  let redirected = '';
  vm.runInNewContext(spinSource, { URLSearchParams, window: { location: { search: mode, replace(url) { redirected = url; } } } });
  assert.equal(redirected, 'index.html', `Retired draw blocked: ${mode}`);
}
let paidReached = false;
vm.runInNewContext(spinSource, { URLSearchParams, window: { location: { search: '?mode=paid', replace() { throw new Error('Paid recovery must not be redirected'); } } }, document: { getElementById() { paidReached = true; return null; } } });
assert(paidReached, 'Existing paid-result path remains available');
console.log('PASS: new checkout returns 410; free/code/test draws stop; paid recovery remains available');

let visible = false;
let card = null;
let observer;
let mounts = 0;
const body = { appendChild(node) { card = node; mounts++; } };
const fakeDocument = {
  currentScript: { src: 'https://example.com/shared/diagnosis-followup.js' }, readyState: 'complete', body,
  querySelectorAll() { return [{ getClientRects: () => visible ? [{}] : [], closest: () => null }]; },
  querySelector(selector) { return selector === '.mobby-followup' ? card : selector === '#app' ? body : null; },
  createElement() { return { hidden: false, setAttribute() {}, innerHTML: '' }; }
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'shared/diagnosis-followup.js'), 'utf8'), {
  URL, document: fakeDocument, requestAnimationFrame(callback) { callback(); },
  MutationObserver: class { constructor(callback) { observer = callback; } observe() {} }
});
assert.equal(card, null, 'No app promotion during questions');
visible = true; observer();
assert(card.innerHTML.includes('https://example.com/#mobidou'));
assert(!card.innerHTML.includes('gacha/index.html'));
observer(); assert.equal(mounts, 1, 'No duplicate promotion');
visible = false; observer(); assert.equal(card.hidden, true, 'Retry hides promotion');
visible = true; observer(); assert.equal(card.hidden, false, 'Result restores promotion');
console.log('PASS: diagnosis result app referral appears once, hides on retry, and returns with results');
