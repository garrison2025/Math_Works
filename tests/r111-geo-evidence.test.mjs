import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GEO_GUIDES} from '../src/lib/geo-answer-guides.ts';
import routes from '../src/data/routes.json' with {type:'json'};
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');

test('R111 topic answers are human-specific and available only for real generator URLs',()=>{
 const live=new Set(routes.filter(r=>r.type!=='HOLD').map(r=>r.slug));
 const slugs=Object.keys(GEO_GUIDES);
 assert.equal(slugs.length,10,'Exactly ten editorially reviewed guides');
 const questions=new Set();
 for(const [slug,guide] of Object.entries(GEO_GUIDES)){
  assert.ok(live.has(slug),'Guide without a real generator: '+slug);
  assert.ok(guide.purpose.length>=95,'Insufficient real use-case context '+slug);
  assert.equal(guide.answers.length,2,'Guides require two concise concrete answers '+slug);
  assert.match(guide.related.href,/^\/[a-z0-9-]+\/$/,'Focused related href '+slug);
  assert.ok(live.has(guide.related.href.slice(1,-1)),'Broken related generator '+slug);
  for(const qa of guide.answers){
   assert.ok(qa.question.length>=25 && qa.answer.length>=95,'Insufficient classroom answer '+slug);
   assert.ok(!questions.has(qa.question),'Repeated question '+qa.question);
   questions.add(qa.question);
  }
 }
});
test('R111 pages expose visible, static topic answers without fabricated FAQ rich-results markup',()=>{
 const page=read('../src/pages/[slug]/index.astro');
 const component=read('../src/components/GeoTopicAnswers.astro');
 assert.match(page,/GeoTopicAnswers slug=\{route\.slug\}/);
 assert.match(component,/data-geo-answers/);
 assert.match(component,/<h3>\{item\.question\}<\/h3>/);
 assert.match(component,/<p>\{item\.answer\}<\/p>/);
 assert.doesNotMatch(component,/FAQPage|aggregateRating|author.*teacher|datePublished/);
});
test('R111 library has task-level distinctions and About explains independently checkable limits',()=>{
 const library=read('../src/pages/worksheets/index.astro');
 const about=read('../src/pages/about.astro');
 assert.match(library,/data-geo-library-guide/);
 for(const slug of ['long-division-worksheets','equivalent-fractions-worksheets','surface-area-worksheets']){
  assert.match(library,new RegExp('/'+slug+'/'));
 }
 assert.match(about,/Exactly what is generated/);
 assert.match(about,/Which details can be independently checked/);
 assert.match(about,/What to report if an answer appears wrong/);
 assert.match(about,/physical ruler/);
 assert.match(about,/automated checks do not certify/i);
});
