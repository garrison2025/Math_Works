import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet} from '../src/lib/math.ts';
import {graphGeometry} from '../src/lib/graph.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
import {maxQuantityForTopic} from '../src/lib/topic-options.ts';
const topic='linear-equations-worksheets';
test('R17: 12,000 algebraic graph oracles prevent practice-answer leaks',()=>{
 for(const difficulty of ['easy','standard','challenge'])for(const slope of ['mixed','positive','negative','zero'])for(let seed=0;seed<1000;seed++){
  const p=sampleProblem(topic,seed,difficulty,{slope,task:'graph'});
  const match=p.payload.question.match(/y = (-?\d+)x ([−+]) (\d+)/);
  assert.ok(match);
  const m=Number(match[1]),b=(match[2]==='−'?-1:1)*Number(match[3]);
  assert.equal(p.expectedAnswer,`slope = ${m}; y-intercept = (0, ${b})`);
  assert.deepEqual(p.diagramSpec?.values,[m,b,0,b]);
  assert.deepEqual(p.diagramSpec?.labels,['draw']);
  assert.ok(slope==='mixed'||slope==='positive'&&m>0||slope==='negative'&&m<0||slope==='zero'&&m===0);
  const geom=graphGeometry(p.diagramSpec);const [[x1,y1],[x2,y2]]=geom.segment;
  assert.ok(x1<x2);
  assert.ok(Math.abs(y1-(m*x1+b))<1e-8);
  assert.ok(Math.abs(y2-(m*x2+b))<1e-8);
  assert.doesNotMatch(diagramSVG(p.diagramSpec),/solution-linear-line|solution-linear-point/);
  assert.match(diagramSVG(p.diagramSpec,true),/class="solution-linear-line"/);
  assert.equal((diagramSVG(p.diagramSpec,true).match(/class="solution-linear-point"/g)||[]).length,2);
 }
});
test('R17: graph choice caps, uniqueness and reproducible share links',()=>{
 for(const difficulty of ['easy','standard','challenge'])for(const slope of ['mixed','positive','negative','zero']){
  const count=slope==='zero'?10:slope==='mixed'?40:30;
  assert.equal(maxQuantityForTopic(topic,{slope,task:'graph'},difficulty),count);
  for(let seed=1;seed<=20;seed++){
   const set=makeWorksheet(topic,seed,count,difficulty,{slope,task:'graph'});
   assert.equal(new Set(set.problems.map(p=>p.payload.question)).size,count);
   assert.deepEqual(set.answerMap,set.problems.map(p=>({id:p.id,answer:p.expectedAnswer})));
  }
 }
 const settings={seed:20261105,difficulty:'standard',paper:'A4',quantity:8,options:{slope:'negative',task:'graph'}};
 const link=buildWorksheetLink('https://math-works.pages.dev/linear-equations-worksheets/',topic,settings);
 assert.deepEqual(parseWorksheetLink(link,topic),settings);
});
test('R17: 3,000 old evaluate-mode seeds still equal the line substitution',()=>{
 for(let seed=0;seed<3000;seed++){
  const p=sampleProblem(topic,seed,'standard',{task:'evaluate',slope:'mixed'}),[m,b,x,y]=p.diagramSpec.values;
  assert.equal(y,m*x+b);assert.equal(p.expectedAnswer,String(y));
  assert.ok(!p.diagramSpec.labels?.includes('draw'));
 }
});

test('R17 graph grids provide unit-spaced tick lines in both question and answer SVG',()=>{
 const p=sampleProblem(topic,123,'standard',{slope:'positive',task:'graph'});
 const blank=diagramSVG(p.diagramSpec),answer=diagramSVG(p.diagramSpec,true);
 const gridCount=(svg)=>(svg.match(/stroke="#e1e8ee"/g)||[]).length;
 assert.ok(gridCount(blank)>=20,'Blank graph should have a unit-grid, not just axes');
 assert.equal(gridCount(blank),gridCount(answer),'Solutions must use the same coordinate scale as student grid');
 assert.doesNotMatch(blank,/solution-linear/);assert.match(answer,/solution-linear-line/);
});
