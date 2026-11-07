import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import routes from '../src/data/routes.json' with {type:'json'};
import targets from '../src/data/seo-targets.json' with {type:'json'};
import corrections from '../src/data/seo-routing-r70.json' with {type:'json'};
import {correctedTaskLinksFor} from '../src/lib/seo-routing-r70.ts';
import {WORKSHEET_SECTIONS,worksheetSectionFor} from '../src/lib/worksheet-directory.ts';
import {parseWorksheetLink} from '../src/lib/worksheet-link.ts';
import {releasePaths} from '../src/lib/indexation.ts';

test('R89 frozen V2 data: exactly 488 actual source terms, 55 intents and 51 built-generator focus terms',()=>{
 const source=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8').trimEnd().split(/\r?\n/);
 assert.equal(source.length-1,488);
 const tick=String.fromCharCode(96);
 const owned=new Map(),types={};
 const keys=new Set();
 for(const line of source.slice(1)){
  const name=line.slice(0,line.indexOf(','));
  assert.ok(name.startsWith(tick)&&name.endsWith(tick));
  const keyword=name.slice(1,-1);
  assert.ok(!keys.has(keyword),'Duplicate V2 term');keys.add(keyword);
  const route=line.match(/,`\/([^/]+)\/`$/)?.[1];
  assert.ok(route);
  owned.set(route,(owned.get(route)||0)+1);
 }
 assert.equal(keys.size,488);
 assert.equal(owned.size,55);
 assert.equal(routes.length,55);
 assert.equal(targets.length,51);
 for(const r of routes){
  assert.ok(owned.has(r.slug));
  types[r.type]=(types[r.type]||0)+owned.get(r.slug);
  assert.equal(targets.some(t=>t.slug===r.slug),r.type!=='HOLD');
 }
 assert.deepEqual(types,{CONDITIONAL_TOOL:272,CONDITIONAL_HUB:165,HOLD:51});
});
test('R89 all 15 keyword corrections open their real math mode and restore it on worksheet page',()=>{
 const corrected=corrections.rows.filter(x=>x.status==='corrected');
 assert.equal(corrected.length,15);
 for(const c of corrected){
  const links=correctedTaskLinksFor(c.sourceRoute).filter(link=>link.slug===c.effectiveRoute);
  const match=links.find(link=>{
   const selected=parseWorksheetLink('https://math-works.pages.dev'+link.href,c.effectiveRoute);
   return Object.entries(c.requiredOptions).every(([key,val])=>selected.options?.[key]===val);
  });
  assert.ok(match,'Missing precise V2 practice link for '+c.keyword);
  assert.ok(match.href.startsWith('/'+c.effectiveRoute+'/'));
  assert.ok(match.description.length>25);
 }
 assert.equal(correctedTaskLinksFor('unknown-topic').length,0);
});
test('R89 six V2 subject routes are built from all 51 functional topics but never the 4 HOLDs',()=>{
 const slugs=routes.filter(x=>x.type!=='HOLD').map(x=>x.slug);
 const counts=new Map(WORKSHEET_SECTIONS.map(x=>[x.slug,0]));
 for(const slug of slugs){
  const group=worksheetSectionFor(slug);
  assert.ok(counts.has(group));
  counts.set(group,counts.get(group)+1);
 }
 assert.equal([...counts.values()].reduce((a,b)=>a+b,0),51);
 assert.ok([...counts.values()].every(n=>n>0));
 for(const name of ['worksheets',...WORKSHEET_SECTIONS.map(s=>s.slug)]){
  const path=new URL('../src/pages/'+name+'/index.astro',import.meta.url);
  assert.ok(existsSync(path),'Missing V2 subject route '+name);
 }
 assert.equal(routes.filter(x=>x.type==='HOLD').length,4);
 assert.deepEqual(releasePaths({site:'https://math-works.pages.dev',enabled:'true',
  routes:slugs.join(','),branch:'main'},routes),[],'Preview must never be indexable');
});
