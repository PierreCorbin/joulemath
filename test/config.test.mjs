import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {test} from 'node:test';
import {CONSENT_TEXT, CONSENT_VERSION} from '../functions/lib/newsletter.mjs';

const root = new URL('..', import.meta.url);

function read(path) {
  return fs.readFileSync(new URL(path, root), 'utf8');
}

test('the form, the page, and the client repeat the same consent and the same truthful copy', () => {
  const lib = read('functions/lib/signup-messages.mjs').replace('export function messageFor', 'function messageFor');
  const client = read('src/js/signup.js');
  const libBody = lib.slice(lib.indexOf('function messageFor'), lib.indexOf('/*end-messageFor*/'));
  const clientBody = client.slice(client.indexOf('function messageFor'), client.indexOf('/*end-messageFor*/'));
  assert.equal(clientBody, libBody);
  assert.equal(client.includes('Thanks, you are on the list'), false);
  assert.match(client, /d\.emailSent === true/);
  assert.match(client, /d\.onList === true/);
  const tracker = read('src/js/t.js');
  assert.match(tracker, /s\('signup','attempt'\)/);
  assert.equal(tracker.includes("s('signup','submit')"), false);
  const build = read('build.mjs');
  assert.match(build, new RegExp(CONSENT_TEXT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(build, new RegExp('name="consent_version" value="' + CONSENT_VERSION + '"'));
  assert.match(build, /name="consent" value="yes"/);
  const about = read('src/about/index.html');
  assert.match(about, /not subscribed until you open it/);
  assert.match(about, /short-lived hash of your IP address/);
  assert.match(about, /do not store Bitcoin payout addresses or Vast\.ai machine IDs/);
  assert.equal(about.includes('\u2014'), false);
});

test('production KV ids stay on production and preview setup refuses to share them', () => {
  const wrangler = read('wrangler.toml');
  assert.match(wrangler, /binding = "SUBSCRIBERS"/);
  assert.match(wrangler, /09fb6b918f8b4ea08a5ec401975afb41/);
  assert.match(wrangler, /binding = "EVENTS"/);
  assert.match(wrangler, /25910d4d5f5e4dee8dd20e3336a1e227/);
  assert.doesNotMatch(wrangler, /env\.preview/);
  const setup = read('.github/workflows/kv-setup.yml');
  assert.match(setup, /refusing to bind shared or swapped KV namespaces/);
  assert.match(setup, /SUBSCRIBERS_PREVIEW/);
  assert.match(setup, /EVENTS_PREVIEW/);
  assert.equal(setup.includes('09fb6b918f8b4ea08a5ec401975afb41'), false);
  assert.equal(setup.includes('25910d4d5f5e4dee8dd20e3336a1e227'), false);
  const report = read('scripts/events-report.mjs');
  assert.match(report, /metric:/);
  assert.match(report, /not subscribers/);
  assert.match(report, /server-verified/);
  const fleetApi = read('functions/api/fleet.js');
  const fleetClient = read('src/js/fleet.js');
  assert.match(fleetApi, /stores NOTHING/);
  assert.match(fleetClient, /stored ONLY in browser localStorage/);
  const newsletter = read('functions/lib/newsletter.mjs');
  assert.equal(newsletter.includes('machine_id'), false);
  assert.equal(newsletter.includes('localStorage'), false);
});

test('the preview KV filter removes production bindings and keeps other config', () => {
  const fixture = {
    success: true,
    result: {
      deployment_configs: {
        production: {
          env_vars: {NEWSLETTER_FROM: {value: 'kept'}},
          kv_namespaces: {
            SUBSCRIBERS: {namespace_id: 'prod-sub'},
            EVENTS: {namespace_id: 'prod-ev'},
          },
        },
        preview: {
          env_vars: {OTHER: {value: 'preview-kept'}},
          kv_namespaces: {
            SUBSCRIBERS: {namespace_id: 'prod-sub'},
            EVENTS: {namespace_id: 'prod-ev'},
            OTHER_KV: {namespace_id: 'keep-me'},
          },
        },
      },
    },
  };
  const out = execFileSync('jq', [
    '-f', new URL('scripts/kv-isolate.jq', root).pathname,
    '--arg', 'prod_sub', 'prod-sub',
    '--arg', 'prod_ev', 'prod-ev',
    '--arg', 'prev_sub', 'prev-sub',
    '--arg', 'prev_ev', 'prev-ev',
  ], {input: JSON.stringify(fixture), encoding: 'utf8'});
  const body = JSON.parse(out);
  const prod = body.deployment_configs.production;
  const preview = body.deployment_configs.preview;
  assert.equal(prod.env_vars.NEWSLETTER_FROM.value, 'kept');
  assert.equal(prod.kv_namespaces.SUBSCRIBERS.namespace_id, 'prod-sub');
  assert.equal(prod.kv_namespaces.EVENTS.namespace_id, 'prod-ev');
  assert.equal(preview.env_vars.OTHER.value, 'preview-kept');
  assert.equal(Object.hasOwn(preview.kv_namespaces, 'SUBSCRIBERS'), false);
  assert.equal(Object.hasOwn(preview.kv_namespaces, 'EVENTS'), false);
  assert.equal(preview.kv_namespaces.OTHER_KV.namespace_id, 'keep-me');
  assert.equal(preview.kv_namespaces.SUBSCRIBERS_PREVIEW.namespace_id, 'prev-sub');
  assert.equal(preview.kv_namespaces.EVENTS_PREVIEW.namespace_id, 'prev-ev');
  const previewIds = Object.values(preview.kv_namespaces).map(item => item.namespace_id);
  assert.equal(previewIds.includes('prod-sub'), false);
  assert.equal(previewIds.includes('prod-ev'), false);
});
