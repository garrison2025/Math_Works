import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import routes from '../src/data/routes.json' with {type:'json'};
import focus from '../src/data/seo-targets.json' with {type:'json'};
import r62 from '../src/data/seo-intent-review.json' with {type:'json'};
import r63 from '../src/data/seo-intent-r63.json' with {type:'json'};
import {SEO_INTENT_CONTRASTS,relatedSkillTasks,SKILL_RELATIONS} from '../src/lib/intent-relations.ts';
import {sampleProblem} from '../src/lib/math.ts';
import {releasePaths} from '../src/lib/indexation.ts';

function splitCsv(s){
 let out=[],value='',quoted=false;
 for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(ch==='"'){if(quoted&&s[i+1]==='"'){value+='"';i++}else quoted=!quoted}
  else if(ch===','&&!quoted){out.push(value);value=''}else value+=ch;
 }
 out.push(value);return out;
}
const rows=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8')
 .trimEnd().split(/\r?\n/).slice(1).map(line=>{
  const v=splitCsv(line);
  assert.equal(v.length,7);
  return {keyword:v[0].slice(1,-1),slug:v[6].slice(2,-2),volume:Number(v[1]),kd:Number(v[2])};
 });
const all=new Map(rows.map(r=>[r.slug+'|'+r.keyword,r]));
test('R63 extends 21 initial source-matched flags with 124 unique new audited search intents',()=>{
 assert.equal(r63.schema,'mathworks-r63-intent-triage/v1');
 assert.equal(rows.length,488);
 assert.equal(r62.flagged.length,21);
 assert.equal(r63.issues.length,124);
 const issues=[...r62.flagged,...r63.issues];
 const issueKeys=new Set();
 const breakdown={unsupported:0,'wrong-page':0,'needs-review':0};
 for(const i of issues){
  const k=i.slug+'|'+i.keyword;
  assert.ok(all.has(k),'Flagged phrase must be a real original source phrase: '+k);
  assert.ok(!issueKeys.has(k),'Repeated exact issue: '+k);
  issueKeys.add(k);
  assert.ok(i.reason.length>=25);
  breakdown[i.classification]++;
  if(i.suggestedRoute){
   const route=routes.find(r=>r.slug===i.suggestedRoute);
   assert.ok(route&&route.type!=='HOLD');
  }
 }
 assert.equal(issueKeys.size,145);
 assert.deepEqual(breakdown,{unsupported:67,'wrong-page':19,'needs-review':59});
 assert.equal(rows.length-issueKeys.size,343);
 assert.equal(focus.length,51);
 for(const t of focus){
  assert.ok(all.has(t.slug+'|'+t.primary));
  assert.ok(!issueKeys.has(t.slug+'|'+t.primary),'Do not advertise a known unsupported primary intent');
 }
});
test('R63 original 24 V2 skills stay intact; six new user-task contrasts link to actual distinct generators',()=>{
 assert.equal(SKILL_RELATIONS.length,24);
 assert.equal(SEO_INTENT_CONTRASTS.length,6);
 const seen=new Set(SKILL_RELATIONS.map(r=>r.parent+'|'+r.child));
 for(const c of SEO_INTENT_CONTRASTS){
  const key=c.parent+'|'+c.child;
  assert.ok(!seen.has(key),'New relation already exists');
  seen.add(key);
  assert.ok(c.difference.length>=35);
  const a=routes.find(r=>r.slug===c.parent);
  const b=routes.find(r=>r.slug===c.child);
  assert.ok(a&&a.type!=='HOLD'&&b&&b.type!=='HOLD');
  assert.ok(relatedSkillTasks(c.parent).some(x=>x.slug===c.child));
  assert.ok(relatedSkillTasks(c.child).some(x=>x.slug===c.parent));
  let mismatches=0;
  for(const seed of [17,93,20261106]){
   const p=sampleProblem(c.parent,seed),q=sampleProblem(c.child,seed);
   if(p.payload.question!==q.payload.question||p.diagramSpec?.kind!==q.diagramSpec?.kind)mismatches++;
  }
  assert.ok(mismatches>=2,'These are not meaningfully distinct printable tasks');
 }
});
test('R63 triage can never enable noindex preview or publish unreviewed hubs and holds',()=>{
 const approved=routes.map(x=>x.slug).join(',');
 const inputs={site:'https://math-works.pages.dev',enabled:'true',routes:approved,branch:'main'};
 assert.deepEqual(releasePaths(inputs,routes),[]);
 const real=releasePaths({...inputs,site:'https://future-purchased-example-math.org'},routes);
 assert.ok(!real.includes('/area-worksheets/'));
 assert.ok(!real.includes('/fractions-worksheets/'));
 assert.ok(!real.includes('/geometry-general-worksheets/'));
});
