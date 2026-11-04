import test from 'node:test';
import assert from 'node:assert/strict';
import {makeWorksheet,quartiles} from '../src/lib/math.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {boxPracticeAxis} from '../src/lib/graph.ts';
import {assertWorksheetIntegrity} from '../src/lib/sheet-integrity.ts';
import routes from '../src/data/routes.json' with {type:'json'};

const clone=(x)=>structuredClone(x);

test('all 51 active topic worksheets have an exactly paired answer key before export',()=>{
 const enabled=routes.filter(r=>r.type!=='HOLD'); assert.equal(enabled.length,51);
 for(const {slug} of enabled){
  for(const count of [4,8,16]){
   const set=makeWorksheet(slug,3011,count,'standard');
   assert.doesNotThrow(()=>assertWorksheetIntegrity(set),`${slug}, ${count}`);
  }
 }
});

test('reject forged or out-of-order answer maps before rendering any PDF',()=>{
 const set=makeWorksheet('two-step-equations-worksheets',42,8);
 const corruptions=[
  s=>s.answerMap.reverse(),
  s=>s.answerMap[2].answer='wrong',
  s=>s.problems[2].id='Q999',
  s=>s.problems[2].topicId='other',
  s=>s.problems[2].payload.question=s.problems[0].payload.question,
  s=>s.problems[1].solutionSteps=[],
  s=>s.problems.pop(),
  s=>s.optionsHash='not-a-hash'
 ];
 for(const mutate of corruptions){const bad=clone(set);mutate(bad);assert.throws(()=>assertWorksheetIntegrity(bad));}
});

test('box-plot practice diagrams show blank axes, not completed quartile boxes or outlier locations',()=>{
 for(let seed=0;seed<300;seed++){
  const p=makeWorksheet('box-plots-worksheets',seed,4).problems[0];
  const raw=p.payload.question.match(/\[([^\]]+)\]/)?.[1].split(', ').map(Number);
  assert.ok(raw?.length===8);
  assert.equal(p.diagramSpec.kind,'box-practice');
  assert.deepEqual(p.diagramSpec.values,raw);
  const axis=boxPracticeAxis(raw);
  assert.ok(axis.start<=Math.min(...raw));assert.ok(axis.end>=Math.max(...raw));
  assert.ok(axis.ticks.length>=2&&axis.ticks.length<=11);
  for(const tick of axis.ticks)assert.ok(axis.position(tick)>=-1e-10&&axis.position(tick)<=1+1e-10);
  const svg=diagramSVG(p.diagramSpec);
  assert.match(svg,/Draw the box, median and whiskers/);
  assert.doesNotMatch(svg,/<rect[^>]*width=/);
  // Statistics must remain solvable independently from the printed data.
  const q=quartiles(raw);
  assert.ok(q.q1<=q.median&&q.median<=q.q3);
 }
});

test('box axes reject missing, fractional and non-finite data',()=>{
 for(const values of [[],[1,2,3],[1,2,3,NaN],[1,2,3,Infinity],[1,2,3,4.5]])assert.throws(()=>boxPracticeAxis(values));
});
