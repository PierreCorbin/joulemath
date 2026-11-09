import assert from 'node:assert/strict';
import {test} from 'node:test';
import {onRequest} from '../functions/go/flash.js';

test('Flash routes GPU visitors to GPU and mining visitors to mining, preserving attribution', () => {
  for (const [query, path, op] of [
    ['c=gpu-hub&p=cta&op=ai_gpu', '/gpu', 'ai_gpu'],
    ['c=guide-rent-gpu&p=cta&op=ai_gpu', '/gpu', 'ai_gpu'],
    ['c=gpu-h100', '/gpu', 'ai_gpu'],
    ['c=fleet', '/gpu', 'ai_gpu'],
    ['c=fleet&p=reconcile&op=compute', '/mining', 'compute'],
    ['c=asic-model&p=cta', '/mining', 'compute'],
    ['c=gpu-hub&op=mining', '/mining', 'mining'],
    ['', '/mining', 'compute'],
  ]) {
    const response = onRequest({request: new Request(`https://joulemath.com/go/flash?${query}`)});
    const target = new URL(response.headers.get('Location'));
    assert.equal(response.status, 302);
    assert.equal(target.origin, 'https://paywithflash.com');
    assert.equal(target.pathname, path);
    assert.equal(target.searchParams.get('op'), op);
    assert.equal(target.searchParams.get('utm_source'), 'joulemath');
    assert.equal(target.searchParams.get('utm_medium'), 'referral');
    const source = new URLSearchParams(query);
    assert.equal(target.searchParams.get('utm_campaign'), source.get('c') || 'site');
    assert.equal(target.searchParams.get('utm_content'), source.get('p'));
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  }
});
