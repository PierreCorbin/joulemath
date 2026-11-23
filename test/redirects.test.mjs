import test from 'node:test';import assert from 'node:assert/strict';
import {redirectFor,REDIRECTS} from '../functions/lib/redirects.mjs';
test('merged ASIC pages 301 to their /asic/ section, with or without slash',()=>{
  assert.equal(redirectFor('/asic/antminer-s21-xp/'),'/asic/#antminer-s21-xp');
  assert.equal(redirectFor('/asic/antminer-s19-xp'),'/asic/#antminer-s19-xp');
  assert.equal(redirectFor('/asic/antminer-s21/'),null);
  assert.equal(redirectFor('/asic/'),null);
  for(const [f,t] of REDIRECTS){assert.ok(f.endsWith('/'));assert.ok(t.startsWith('/asic/#'));}
});
