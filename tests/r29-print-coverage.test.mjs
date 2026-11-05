import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeWorksheet} from '../src/lib/math.ts';
import {maxQuantityForTopic} from '../src/lib/topic-options.ts';

const active=JSON.parse(readFileSync(new URL('../src/data/routes.json',import.meta.url),'utf8'))
 .filter(r=>r.type==='CONDITIONAL_TOOL'||r.type==='CONDITIONAL_HUB');
test('R29 print-release scope contains every live route but no HOLD pages',()=>{
 assert.equal(active.length,51);
 assert.ok(active.every(r=>r.type!=='HOLD'));
});
test('R29 maximal 40-question or topic-cap sheets retain stable layout and answer pairing',()=>{
 let total=0;
 for(const [i,route] of active.entries())for(const difficulty of ['standard','challenge']){
  const cap=maxQuantityForTopic(route.slug,{},difficulty),seed=20261105+i*977+(difficulty==='challenge'?4099:0);
  const first=makeWorksheet(route.slug,seed,cap,difficulty);
  const next=makeWorksheet(route.slug,seed,cap,difficulty);
  assert.equal(first.layoutVersion,'2',route.slug);
  assert.deepEqual(first,next,`non-repeatable PDF input ${route.slug} ${difficulty}`);
  assert.equal(first.problems.length,cap);
  for(let k=0;k<cap;k++)assert.deepEqual(first.answerMap[k],{id:`Q${k+1}`,answer:first.problems[k].expectedAnswer});
  total+=first.problems.length;
 }
 assert.ok(total>=3000,`Too few full-size problems were verified: ${total}`);
});
