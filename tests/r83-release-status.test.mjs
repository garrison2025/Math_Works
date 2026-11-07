import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EXTRA_PACK_KEYS} from '../src/lib/extra-pack-link.ts';
const here=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('R83 release overview has a current single source of truth and no false search launch claims',()=>{
 const status=here('CURRENT-STATUS.md'),readme=here('README.md'),evidence=here('RELEASE-EVIDENCE.md');
 for(const [name,content] of [['README',readme],['RELEASE-EVIDENCE',evidence]]){
  assert.match(content,/CURRENT-STATUS\.md/,name+' does not point to current status');
  assert.match(content,/historical|archival/i,name+' does not flag stale history');
 }
 assert.match(status,/\b488\b/);
 assert.match(status,/\b343\b/);
 assert.match(status,/\b72\b/);
 assert.match(status,/\bnoindex,nofollow\b/);
 assert.match(status,/\bNOT YET COMPLETED\b/);
 assert.match(status,/2026-11-07/);
 assert.equal(EXTRA_PACK_KEYS.length,29);
 const routes=JSON.parse(here('src/data/routes.json'));
 assert.equal(routes.length,55);
 assert.equal(routes.filter(r=>r.type!=='HOLD').length,51);
 assert.equal(routes.filter(r=>r.type==='HOLD').length,4);
 const actual=[58,15,9,59,4,343];
 assert.equal(actual.reduce((a,b)=>a+b,0),488);
 assert.equal(actual[2]+actual[3]+actual[4],72);
});
