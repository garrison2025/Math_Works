import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GEO_GUIDES} from '../src/lib/geo-answer-guides.ts';
import {GEO_REFERENCES} from '../src/lib/geo-reference-links.ts';
import seoTargets from '../src/data/seo-targets.json' with {type:'json'};
import coverage from '../src/data/geo-r113-coverage.json' with {type:'json'};
import routes from '../src/data/routes.json' with {type:'json'};
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const R111_INITIAL=['two-step-equations-worksheets','long-division-worksheets','adding-unlike-fractions-worksheets','equivalent-fractions-worksheets','area-of-triangles-worksheets','volume-of-rectangular-prisms-worksheets','surface-area-worksheets','mean-median-mode-range-worksheets','box-plots-worksheets','printable-protractor'];
const R113_ADDED=['multiplication-worksheets','mixed-addition-subtraction-worksheets','pythagorean-worksheets','multiplication-tables-worksheets','subtraction-worksheets','one-step-equations-worksheets','decimal-multiplication-worksheets','fractions-worksheets','two-digit-multiplication-worksheets','order-of-operations-worksheets'];

test('R111 topic answers are human-specific and available only for real generator URLs',()=>{
 const live=new Set(routes.filter(r=>r.type!=='HOLD').map(r=>r.slug));
 const slugs=Object.keys(GEO_GUIDES);
 assert.equal(slugs.length,20,'Ten R111 guides plus ten R113 high-demand expansions');
 assert.deepEqual(Object.keys(GEO_REFERENCES).sort(),slugs.slice().sort(),'Every visible answer guide needs a real standards context link');
 const questions=new Set();
 for(const [slug,guide] of Object.entries(GEO_GUIDES)){
  assert.ok(live.has(slug),'Guide without a real generator: '+slug);
  assert.ok(GEO_REFERENCES[slug],'Missing verified public reference '+slug);
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

test('R113 expands the ten highest-demand uncovered topics without adding indexed URLs',()=>{
 assert.equal(coverage.schema,'mathworks-r113-geo-content-expansion/v1');
 assert.deepEqual(coverage.addedGuides.slice().sort(),R113_ADDED.slice().sort());
 assert.equal(coverage.baselineGuideCount,10);
 assert.equal(coverage.totalGuideCount,20);
 assert.equal(coverage.visibleQuestionAnswerPairs,40);
 assert.equal(coverage.newIndexableUrls,0);
 const highDemand=seoTargets.filter(row=>!R111_INITIAL.includes(row.slug)&&row.sourceMonthlyVolume>=2400);
 assert.deepEqual(highDemand.map(row=>row.slug).sort(),R113_ADDED.slice().sort(),'Select the ten uncovered pages at or above the historical 2,400-volume threshold');
 for(const slug of R113_ADDED){
  const target=seoTargets.find(row=>row.slug===slug);
  assert.ok(target,'Missing original keyword target '+slug);
  assert.ok(target.sourceSemrushKD<=29,'KD must remain within the existing hard gate '+slug);
 }
});
