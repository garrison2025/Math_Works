import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet} from '../src/lib/math.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {scatterGeometry} from '../src/lib/graph.ts';
import {maxQuantityForTopic,normalizeTopicOptions} from '../src/lib/topic-options.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';

const topic='scatter-plot-worksheets';
const identify=(ys)=>{
 const middle=(ys.reduce((a,b)=>a+b,0)/ys.length);
 const covariance=ys.reduce((acc,y,i)=>acc+(i+1-3.5)*(y-middle),0);
 return covariance>1e-9?'positive':covariance< -1e-9?'negative':'none';
};
test('R18: independent six-point trend and no-trend oracles across 18,000 generated problems',()=>{
 let total=0;
 for(const difficulty of ['easy','standard','challenge'])for(const trend of ['positive','negative','none'])for(const task of ['identify','plot'])for(let seed=0;seed<1000;seed++){
  const p=sampleProblem(topic,seed,difficulty,{trend,task});
  const d=p.diagramSpec;
  assert.equal(d.kind,'scatter');
  assert.equal(d.values.length,12);
  const actualY=d.values.filter((_,i)=>i%2===1);
  assert.ok(actualY.every(y=>Number.isInteger(y)&&y>=0&&y<=10));
  assert.equal(identify(actualY),trend,`${trend} seed ${seed}`);
  assert.deepEqual(d.values.filter((_,i)=>i%2===0),[1,2,3,4,5,6]);
  assert.deepEqual(scatterGeometry(d),actualY.map((y,i)=>[(i+1)/7,y/10]));
  const blank=diagramSVG(d,false),solved=diagramSVG(d,true);
  for(const svg of [blank,solved]){
   assert.ok(svg.includes('>10</text>') && svg.includes('>7</text>'),'The grid needs real-number x/y labels');
   assert.equal((svg.match(/stroke="#e1e8ee"/g)||[]).length,14);
  }
  if(task==='plot'){
   assert.match(p.payload.question,/^Plot these six points/);
   assert.equal(p.expectedAnswer.match(/\(\d+, \d+\)/g)?.length,6);
   assert.equal((blank.match(/scatter-solution-point/g)||[]).length,0,'practice points must stay hidden');
   assert.equal((solved.match(/scatter-solution-point/g)||[]).length,6,'answer graph must show six points');
  }else{
   assert.equal(p.expectedAnswer,trend==='none'?'no clear linear trend':trend);
   assert.equal((blank.match(/scatter-data-point/g)||[]).length,6);
  }
  total++;
 }
 assert.equal(total,18000);
});

test('R18: all scatter settings reproduce answer maps at their maximum distinct sheet quantity',()=>{
 for(const task of ['identify','plot'])for(const trend of ['mixed','positive','negative','none']){
  const opts={task,trend},cap=maxQuantityForTopic(topic,opts);
  assert.equal(cap,trend==='mixed'?40:trend==='none'?10:20);
  for(let seed=1;seed<=80;seed++){
   const sheet=makeWorksheet(topic,seed,cap,'standard',opts);
   assert.equal(sheet.problems.length,cap);
   assert.equal(new Set(sheet.problems.map(p=>JSON.stringify([p.payload.question,p.diagramSpec]))).size,cap);
   assert.deepEqual(sheet.answerMap,sheet.problems.map(p=>({id:p.id,answer:p.expectedAnswer})));
   assert.deepEqual(sheet,makeWorksheet(topic,seed,cap,'standard',opts));
  }
 }
});

test('R18: plot-points share links retain task, trend, seed, and version eight',()=>{
 for(const trend of ['mixed','positive','negative','none']){
  const opts={task:'plot',trend},data={seed:20261105,difficulty:'challenge',quantity:8,paper:'A4',options:normalizeTopicOptions(topic,opts)};
  const link=buildWorksheetLink(`https://math-works.pages.dev/${topic}/`,topic,data);
  assert.equal(new URL(link).searchParams.get('gv'),'11');
  assert.deepEqual(parseWorksheetLink(link,topic),data);
  assert.deepEqual(makeWorksheet(topic,data.seed,8,'challenge',opts),makeWorksheet(topic,data.seed,8,'challenge',parseWorksheetLink(link,topic).options));
 }
});

test('R18: reject malformed or mismatched numerical scatter diagrams',()=>{
 assert.throws(()=>scatterGeometry({kind:'scatter',values:[1,2,2,3]}),/six/);
 assert.throws(()=>scatterGeometry({kind:'scatter',values:[1,2,2,3,3,4,4,5,5,6,6,20]}),/outside/);
});
