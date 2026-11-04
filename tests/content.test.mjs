import test from 'node:test';
import assert from 'node:assert/strict';
import {category,howTo,commonMistakes,titleFor,topicIntro} from '../src/lib/site.ts';
import {readFileSync} from 'node:fs';
const routes = JSON.parse(readFileSync(new URL('../src/data/routes.json',import.meta.url), 'utf8'));

test('math topics appear in pedagogically appropriate subject groups', () => {
 const arithmetic=['order-of-operations-worksheets','number-recognition-worksheets','number-line-worksheets','long-division-worksheets'];
 for(const slug of arithmetic) assert.equal(category(slug),'Arithmetic & Numbers',slug);
 for(const slug of ['linear-equations-worksheets','two-step-equations-worksheets','slope-worksheets'])assert.equal(category(slug),'Algebra & Functions',slug);
 for(const slug of ['pythagorean-worksheets','area-of-triangles-worksheets','printable-protractor'])assert.equal(category(slug),'Geometry & Graphs',slug);
 for(const slug of ['box-plots-worksheets','scatter-plot-worksheets','mean-median-mode-range-worksheets'])assert.equal(category(slug),'Data & Statistics',slug);
});

test('equation instructions do not incorrectly teach inequality sign flips',()=>{
 const eq=howTo('two-step-equations-worksheets').join(' ');
 assert.match(eq,/inverse operations/i);
 assert.doesNotMatch(eq,/reverse inequality|flip </i);
 const inequality=howTo('inequalities-worksheets').join(' ');
 assert.match(inequality,/negative/i);
 assert.match(inequality,/flip/i);
});

test('every published topic has useful contextual instructions and common mistakes',()=>{
 for(const route of routes.filter(r=>r.type!=='HOLD')){
  const guide=howTo(route.slug), mistakes=commonMistakes(route.slug);
  assert.ok(guide.length>=3 && guide.every(Boolean),route.slug);
  assert.ok(mistakes.length>=2 && mistakes.every(Boolean),route.slug);
  assert.ok(titleFor(route.slug).length>0 && topicIntro(route.slug).length>40,route.slug);
 }
});


test('R10 teaching guidance tracks the actual specialty and avoids incorrect equation claims',()=>{
 assert.match(topicIntro('equivalent-fractions-worksheets'),/numerator or denominator/);
 assert.match(howTo('box-plots-worksheets').join(' '),/1\.5×IQR/);
 assert.doesNotMatch(commonMistakes('one-step-equations-worksheets').join(' '),/changes the sign of the solution/);
 assert.match(commonMistakes('multiplying-fractions-worksheets').join(' '),/product/);
 assert.match(howTo('number-recognition-worksheets').join(' '),/number word/);
});
