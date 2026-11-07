import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import routes from '../src/data/routes.json' with {type:'json'};
import corrections from '../src/data/seo-routing-r70.json' with {type:'json'};
import {titleFor} from '../src/lib/site.ts';
import {buildFrozenV2SearchIndex,rankWorksheetMatches} from '../src/lib/worksheet-search.ts';
import {parseWorksheetLink} from '../src/lib/worksheet-link.ts';
const csv=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8');
const make=()=>buildFrozenV2SearchIndex(csv,routes,corrections.rows,titleFor);
test('R90 V2 approved source yields 437 searchable live aliases, no HOLD, no Semrush metrics',()=>{
 const entries=make();
 assert.equal(entries.length,437);
 assert.equal(new Set(entries.map(x=>x.keyword)).size,437);
 assert.ok(entries.every(x=>routes.some(r=>r.slug===x.slug&&r.type!=='HOLD')));
 assert.ok(entries.every(x=>x.href.startsWith('/'+x.slug+'/')&&!x.href.includes('seed=')));
 assert.ok(entries.every(x=>!Object.hasOwn(x,'sourceKD')&&!Object.hasOwn(x,'sourceVolume')));
 assert.ok(!entries.some(x=>x.keyword==='8th grade math worksheets'));
});
test('R90 source search restores all 15 corrected practice selectors',()=>{
 const entries=make();
 for(const change of corrections.rows.filter(x=>x.status==='corrected')){
  const match=entries.find(x=>x.keyword===change.keyword);
  assert.ok(match,'Missing corrected keyword '+change.keyword);
  assert.equal(match.slug,change.effectiveRoute);
  const loaded=parseWorksheetLink('https://math-works.pages.dev'+match.href,match.slug);
  for(const [key,value] of Object.entries(change.requiredOptions))
   assert.equal(loaded.options?.[key],value,'Wrong options for '+change.keyword);
 }
 for(const [query,route,selector] of [
  ['surface area of rectangular prism worksheet','surface-area-worksheets',{solid:'rectangular-prism'}],
  ['function not a function worksheet','domain-range-worksheets',{task:'function-test'}],
  ['3 digit by 1 digit division','long-division-worksheets',{dividendDigits:'three',divisorDigits:'one'}]
 ]){
  const match=rankWorksheetMatches(entries,query,8).find(x=>x.keyword===query);
  assert.ok(match,'Exact V2 search term lost '+query);
  assert.equal(match.slug,route);
  const loaded=parseWorksheetLink('https://math-works.pages.dev'+match.href,route);
  for(const [key,value] of Object.entries(selector))assert.equal(loaded.options?.[key],value);
 }
});
test('R90 matching is predictable, destination-de-duplicated and fails safely',()=>{
 const entries=make();
 assert.deepEqual(rankWorksheetMatches(entries,'a'),[]);
 const exact=rankWorksheetMatches(entries,'two step equations worksheet');
 assert.equal(exact[0].keyword,'two step equations worksheet');
 assert.equal(exact[0].slug,'two-step-equations-worksheets');
 assert.equal(new Set(exact.map(x=>x.href)).size,exact.length);
 assert.ok(rankWorksheetMatches(entries,'BOX    PLOT').some(x=>x.slug==='box-plots-worksheets'));
 assert.deepEqual(rankWorksheetMatches(entries,'zzznotamathworkzzzz'),[]);
});
