import test from 'node:test';
import assert from 'node:assert/strict';
import routes from '../src/data/routes.json' with {type:'json'};
import {sampleProblem} from '../src/lib/math.ts';
import {topicIntro} from '../src/lib/site.ts';
import {SKILL_RELATIONS,relatedSkillTasks} from '../src/lib/intent-relations.ts';
import {releasePaths} from '../src/lib/indexation.ts';

test('R40 all 24 V2 intent relations resolve to different actual built generators',()=>{
 assert.equal(SKILL_RELATIONS.length,24);
 const slugs=new Map(routes.map(r=>[r.slug,r]));
 const pairs=new Set();
 for(const {parent,child,difference} of SKILL_RELATIONS){
  assert.notEqual(parent,child);
  assert.ok(slugs.has(parent)&&slugs.get(parent).type!=='HOLD',parent);
  assert.ok(slugs.has(child)&&slugs.get(child).type!=='HOLD',child);
  assert.ok(difference.length>32);
  const key=parent+'|'+child;assert.ok(!pairs.has(key),'duplicate relationship '+key);
  pairs.add(key);
  assert.ok(relatedSkillTasks(parent).some(r=>r.slug===child));
  assert.ok(relatedSkillTasks(child).some(r=>r.slug===parent));
  assert.notEqual(topicIntro(parent),topicIntro(child),'duplicate static descriptions: '+key);
  let distinct=0;
  for(const seed of [7,42,20261104]){
   const a=sampleProblem(parent,seed),b=sampleProblem(child,seed);
   if(a.payload.question!==b.payload.question||a.diagramSpec?.kind!==b.diagramSpec?.kind)distinct++;
  }
  assert.ok(distinct>=2,'Insufficient example task distinction: '+key);
 }
});
test('R40 unapproved generic hubs and all HOLD routes remain excluded from any indexation whitelist',()=>{
 const input={site:'https://verified-math.example.net',enabled:'true',routes:routes.map(r=>r.slug).join(','),branch:'main'};
 const released=releasePaths(input,routes);
 for(const route of routes.filter(r=>r.type!=='CONDITIONAL_TOOL'))
  assert.ok(!released.includes('/'+route.slug+'/'),route.slug+' leaked into approved routes');
});
