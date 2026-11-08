import assert from 'node:assert/strict';
import {test} from 'node:test';
import {onRequestPost, resetEventsForTests} from '../functions/api/e.js';

function mockKv() {
  const store = new Map();
  return {
    store,
    async get(key) {return store.has(key) ? store.get(key).value : null;},
    async put(key, value, opts) {store.set(key, {value, opts: opts || null});},
    async delete(key) {store.delete(key);},
  };
}

function explosive(name) {
  return new Proxy({}, {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      throw new Error(name + ' ' + String(prop));
    },
  });
}

function post(body, url, headers = {}) {
  const payload = JSON.stringify(body);
  return new Request(url, {
    method: 'POST',
    headers: {'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.200', ...headers},
    body: payload,
  });
}

test('browser signup events count attempts only and never fleet secrets', async () => {
  resetEventsForTests();
  const events = mockKv();
  const env = {EVENTS: events, SUBSCRIBERS: mockKv()};
  const url = 'https://joulemath.com/api/e';
  const attempt = await onRequestPost({request: post({event: 'signup', props: {v: 'attempt'}}, url), env});
  assert.equal(attempt.status, 204);
  const key = [...events.store.keys()][0];
  assert.match(key, /^ev:\d{4}-\d{2}-\d{2}:signup:attempt$/);
  assert.equal(events.store.get(key).value, '1');
  for (const value of ['submit', 'saved', 'confirmed']) {
    const denied = await onRequestPost({request: post({event: 'signup', props: {v: value}}, url, {'cf-connecting-ip': '203.0.113.201'}), env});
    assert.equal(denied.status, 400);
  }
  assert.equal(events.store.size, 1);
  const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080';
  const fleet = await onRequestPost({request: post({event: 'fleet', props: {v: address}}, url, {'cf-connecting-ip': '203.0.113.202'}), env});
  assert.equal(fleet.status, 400);
  const machine = await onRequestPost({request: post({event: 'fleet', props: {v: '142194'}}, url, {'cf-connecting-ip': '203.0.113.203'}), env});
  assert.equal(machine.status, 400);
  const allowed = await onRequestPost({request: post({event: 'fleet', props: {v: 'btc-lookup'}}, url, {'cf-connecting-ip': '203.0.113.204'}), env});
  assert.equal(allowed.status, 204);
  const stored = [...events.store.keys()];
  assert.ok(stored.some(k => k.endsWith(':fleet:btc-lookup')));
  assert.equal(stored.join(' ').includes(address), false);
  assert.equal([...events.store.values()].every(row => /^\d+$/.test(row.value)), true);
  assert.equal(stored.some(k => k.startsWith('metric:')), false);
  const dnt = await onRequestPost({request: post({event: 'signup', props: {v: 'attempt'}}, url, {dnt: '1', 'cf-connecting-ip': '203.0.113.205'}), env});
  assert.equal(dnt.status, 204);
  assert.equal(events.store.get(key).value, '1');
});

test('preview event posts do not touch production counters', async () => {
  resetEventsForTests();
  const prod = explosive('events');
  const dropped = await onRequestPost({
    request: post({event: 'signup', props: {v: 'attempt'}}, 'https://abc.joulemath.pages.dev/api/e'),
    env: {EVENTS: prod, SUBSCRIBERS: explosive('subscribers')},
  });
  assert.equal(dropped.status, 204);
  const preview = mockKv();
  const accepted = await onRequestPost({
    request: post({event: 'signup', props: {v: 'saved'}}, 'https://abc.joulemath.pages.dev/api/e', {'cf-connecting-ip': '203.0.113.210'}),
    env: {EVENTS: prod, EVENTS_PREVIEW: preview},
  });
  assert.equal(accepted.status, 400);
  assert.equal(preview.store.size, 0);
  const attempt = await onRequestPost({
    request: post({event: 'signup', props: {v: 'attempt'}}, 'https://abc.joulemath.pages.dev/api/e', {'cf-connecting-ip': '203.0.113.211'}),
    env: {EVENTS: prod, EVENTS_PREVIEW: preview},
  });
  assert.equal(attempt.status, 204);
  assert.equal([...preview.store.keys()][0].includes(':signup:attempt'), true);
  for (let i = 0; i < 30; i++) {
    await onRequestPost({
      request: post({event: 'preset', props: {v: 'default'}}, 'https://abc.joulemath.pages.dev/api/e', {'cf-connecting-ip': '203.0.113.212'}),
      env: {EVENTS: mockKv(), EVENTS_PREVIEW: preview},
    });
  }
  const flooded = await onRequestPost({
    request: post({event: 'preset', props: {v: 'default'}}, 'https://abc.joulemath.pages.dev/api/e', {'cf-connecting-ip': '203.0.113.212'}),
    env: {EVENTS: mockKv(), EVENTS_PREVIEW: preview},
  });
  assert.equal(flooded.status, 429);
  const production = mockKv();
  const still = await onRequestPost({
    request: post({event: 'preset', props: {v: 'default'}}, 'https://joulemath.com/api/e', {'cf-connecting-ip': '203.0.113.212'}),
    env: {EVENTS: production},
  });
  assert.equal(still.status, 204);
  assert.equal(production.store.size, 1);
});
