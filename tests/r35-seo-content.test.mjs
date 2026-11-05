import test from 'node:test';
import assert from 'node:assert/strict';
import routes from '../src/data/routes.json' with {type:'json'};
import {titleFor,topicIntro} from '../src/lib/site.ts';

test('R35 all 51 live routes have distinct, non-boilerplate English topic descriptions',()=>{
 const live=routes.filter(route=>route.type!=='HOLD');
 assert.equal(live.length,51);
 const seen=new Set();
 for(const route of live){
  const text=topicIntro(route.slug);
  const fallback=`Create fresh ${titleFor(route.slug).toLowerCase()} with a reproducible question set, downloadable practice pages and separate answer keys.`;
  assert.notEqual(text,fallback,`${route.slug} still has generic SEO introduction`);
  assert.ok(text.length>=65&&text.length<=340,`${route.slug} description length is inappropriate`);
  assert.ok(!seen.has(text),`${route.slug} shares a duplicate description`);
  seen.add(text);
 }
});
