import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet} from '../src/lib/math.ts';
import {diagramSVG} from '../src/lib/diagram.ts';

// Answer illustrations must solve the *same* diagram as the question without
// modifying its mathematical input or disclosing the result on practice paper.
test('R15 numeric number lines have blank practice axes and exact marked answer endpoints',()=>{
 for(const sign of ['mixed','positive','negative'])for(let seed=0;seed<1000;seed++){
  const p=sampleProblem('number-line-worksheets',seed,'challenge',{sign});
  assert.equal(p.diagramSpec.kind,'numberline');
  const blank=diagramSVG(p.diagramSpec),solved=diagramSVG(p.diagramSpec,true);
  assert.doesNotMatch(blank,/solution-marker|solution-ray/);
  assert.match(solved,/class="solution-marker"/);
  assert.doesNotMatch(solved,/class="solution-ray"/,'Placement task should use a dot, not an inequality ray');
  assert.match(solved,/r="6" fill="#187b68"/,'Placement point must be filled');
  assert.equal(Number(p.expectedAnswer),p.diagramSpec.values[0]);
  assert.deepEqual(p.diagramSpec.labels,undefined);
 }
});

test('R15 inequalities draw correct ray, open or closed endpoint only on answers',()=>{
 const all=new Set();
 for(let seed=0;seed<2000;seed++){
  const p=sampleProblem('inequalities-worksheets',seed,'standard',{coefficient:'mixed'});
  const op=p.diagramSpec.labels?.[0],n=p.diagramSpec.values[0];
  assert.ok(['<','>','≤','≥'].includes(op));
  assert.equal(p.expectedAnswer,`x ${op} ${n}`);
  all.add(op);
  const blank=diagramSVG(p.diagramSpec),answers=diagramSVG(p.diagramSpec,true);
  assert.doesNotMatch(blank,/class="solution-marker"|class="solution-ray"/);
  assert.match(answers,/class="solution-marker"/);
  assert.match(answers,/class="solution-ray"/);
  assert.ok(answers.includes(`fill="${op==='<'||op==='>'?'white':'#187b68'}"`));
  const target=op==='>'||op==='≥'?392:58;
  assert.ok(answers.includes(`x2="${target}"`));
 }
 assert.deepEqual(all,new Set(['<','>','≤','≥']));
});

test('R15 solved answer SVG does not mutate seeded problems or their answer maps',()=>{
 for(const slug of ['number-line-worksheets','inequalities-worksheets']){
  const sheet=makeWorksheet(slug,20261105,8,'standard');
  const original=JSON.stringify(sheet);
  sheet.problems.forEach(p=>{
   assert.ok(diagramSVG(p.diagramSpec,true).includes('solution-marker'));
   assert.ok(!diagramSVG(p.diagramSpec).includes('solution-marker'));
  });
  assert.equal(JSON.stringify(sheet),original);
  assert.deepEqual(sheet.answerMap,sheet.problems.map(p=>({id:p.id,answer:p.expectedAnswer})));
 }
});
