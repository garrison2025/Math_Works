import test from 'node:test';
import assert from 'node:assert/strict';
import targets from '../src/data/seo-targets.json' with {type:'json'};
import {TOPIC_SEO,topicSeoFor} from '../src/data/topic-seo.ts';
test('every original SEO target has a unique concise factual title, description and H1',()=>{
 assert.equal(targets.length,51);assert.equal(Object.keys(TOPIC_SEO).length,51);
 const titles=new Set(),descs=new Set();
 for(const target of targets){
  const m=topicSeoFor(target.slug);
  assert.ok(m.title.length>=24&&m.title.length<=65, target.slug+' title '+m.title.length);
  assert.ok(m.description.length>=110&&m.description.length<=160,target.slug+' description '+m.description.length);
  assert.ok(m.heading.length>=14&&m.heading.length<=72,target.slug+' H1 '+m.heading.length);
  assert.ok(!titles.has(m.title),'duplicate '+m.title);
  assert.ok(!descs.has(m.description),'duplicate '+m.description);
  titles.add(m.title);descs.add(m.description);
  assert.ok(/worksheet|protractor/i.test(m.heading),'Missing worksheet focus '+target.slug);
 }
});
