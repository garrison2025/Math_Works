import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {correctedTaskLinksFor,historicalIntentState} from '../src/lib/seo-routing-r70.ts';
import corrections from '../src/data/seo-routing-r70.json' with {type:'json'};
import routes from '../src/data/routes.json' with {type:'json'};
import r62 from '../src/data/seo-intent-review.json' with {type:'json'};
import r63 from '../src/data/seo-intent-r63.json' with {type:'json'};
import {topicOptionsFor} from '../src/lib/topic-options.ts';
import {makeWorksheet} from '../src/lib/math.ts';

const flags=[...r62.flagged,...r63.issues];
const source=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8').split(/\r?\n/);
const known=new Map(routes.map(x=>[x.slug,x]));
const quote=String.fromCharCode(96);
test('R70 all 19 original wrong-page flags have exactly one grounded correction or honest explicit defer',()=>{
 assert.equal(corrections.schema,'mathworks-r70-route-corrections/v1');
 assert.equal(corrections.rows.length,19);
 assert.equal(new Set(corrections.rows.map(x=>x.sourceRoute+'|'+x.keyword)).size,19);
 const flagged=flags.filter(x=>x.classification==='wrong-page');
 assert.equal(flagged.length,19);
 for(const f of flagged){
  const matched=corrections.rows.filter(x=>x.sourceRoute===f.slug&&x.keyword===f.keyword);
  assert.equal(matched.length,1,'Unreviewed historical misroute '+f.keyword);
  const r=matched[0];
  assert.match(r.reason,/^[\s\S]{25,}$/);
  assert.ok(source.some(l=>l.startsWith(quote+r.keyword+quote+',')&&l.endsWith(quote+'/'+r.sourceRoute+'/'+quote)));
  assert.equal(historicalIntentState(f.slug,f.keyword).keyword,f.keyword);
  if(r.status==='corrected'){
   assert.ok(known.has(r.effectiveRoute)&&known.get(r.effectiveRoute).type!=='HOLD');
   assert.notEqual(r.effectiveRoute,r.sourceRoute);
   const defs=topicOptionsFor(r.effectiveRoute);
   for(const [key,value] of Object.entries(r.requiredOptions)){
    const option=defs.find(d=>d.key===key);
    assert.ok(option,'Invalid target math settings '+r.effectiveRoute+' '+key);
    assert.ok(option.choices.some(c=>c.value===value),'Impossible option '+key+'='+value);
   }
  }else{
   assert.equal(r.status,'needs-serp');
   assert.equal(r.effectiveRoute,null);
   assert.deepEqual(r.requiredOptions,{});
  }
 }
 assert.equal(corrections.rows.filter(x=>x.status==='corrected').length,15);
 assert.equal(corrections.rows.filter(x=>x.status==='needs-serp').length,4);
});
test('R70 navigation links point to correct deployed pages and never link HOLD or ambiguous queries',()=>{
 for(const r of routes){
  const links=correctedTaskLinksFor(r.slug);
  assert.equal(new Set(links.map(x=>x.slug)).size,links.length);
  for(const link of links){
   assert.equal(known.get(link.slug)?.type!=='HOLD',true);
   assert.ok(link.description.length>25);
   assert.ok(corrections.rows.some(x=>x.sourceRoute===r.slug&&
    x.effectiveRoute===link.slug&&x.status==='corrected'));
  }
 }
 assert.equal(correctedTaskLinksFor('unknown-route').length,0);
 assert.ok(correctedTaskLinksFor('volume-of-rectangular-prisms-worksheets').some(x=>x.slug==='surface-area-worksheets'));
 assert.ok(correctedTaskLinksFor('functions-worksheets').some(x=>x.slug==='domain-range-worksheets'));
});
test('R70 all corrected-route mathematical modes actually solve at least 8 problems without switching generator version',()=>{
 const scenarios=new Map();
 for(const change of corrections.rows){
  if(change.status!=='corrected')continue;
  const key=change.effectiveRoute+'|'+JSON.stringify(change.requiredOptions);
  scenarios.set(key,change);
 }
 for(const r of scenarios.values()){
  const sheet=makeWorksheet(r.effectiveRoute,20261106,8,'standard',r.requiredOptions);
  assert.equal(sheet.generatorVersion,'18');
  assert.equal(sheet.problems.length,8);
  assert.ok(sheet.problems.every(p=>p.payload.question&&p.expectedAnswer&&p.solutionSteps.length>0));
 }
});
