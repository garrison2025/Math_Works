import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet} from '../src/lib/math.ts';
import {scatterGeometry} from '../src/lib/graph.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {maxQuantityForTopic,normalizeTopicOptions} from '../src/lib/topic-options.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
const topic='scatter-plot-worksheets';
test('R18: 18,000 six-point covariance oracles and graph-answer safety checks',()=>{
 let count=0;
 for(const difficulty of ['easy','standard','challenge'])for(const trend of ['positive','negative','none'])for(const task of ['identify','plot'])for(let seed=0;seed<1000;seed++){
  const p=sampleProblem(topic,seed,difficulty,{trend,task}),d=p.diagramSpec;
  assert.equal(d.values.length,12);
  const ys=d.values.filter((_,i)=>i%2===1),avg=ys.reduce((a,b)=>a+b,0)/6;
  const covariance=ys.reduce((c,y,i)=>c+(i+1-3.5)*(y-avg),0);
  const actual=Math.abs(covariance)<1e-9?'none':covariance>0?'positive':'negative';
  assert.equal(actual,trend);
  assert.deepEqual(d.values.filter((_,i)=>i%2===0),[1,2,3,4,5,6]);
  assert.deepEqual(scatterGeometry(d),ys.map((y,i)=>[(i+1)/7,y/10]));
  const practice=diagramSVG(d),answer=diagramSVG(d,true);
  for(const svg of [practice,answer]){assert.ok(svg.includes('>10</text>')&&svg.includes('>7</text>'));assert.equal((svg.match(/stroke="#e1e8ee"/g)||[]).length,14);}
  if(task==='plot'){
   assert.match(p.payload.question,/^Plot these six points/);
   assert.equal((p.expectedAnswer.match(/\(\d+, \d+\)/g)||[]).length,6);
   assert.equal((practice.match(/scatter-solution-point/g)||[]).length,0);
   assert.equal((answer.match(/scatter-solution-point/g)||[]).length,6);
  }else{assert.equal(p.expectedAnswer,trend==='none'?'no clear linear trend':trend);assert.equal((practice.match(/scatter-data-point/g)||[]).length,6);}
  count++;
 }
 assert.equal(count,18000);
});
test('R18: restricted scatter modes generate a full unique deterministic worksheet',()=>{
 for(const task of ['identify','plot'])for(const trend of ['mixed','positive','negative','none']){
  const opts={task,trend},cap=maxQuantityForTopic(topic,opts);
  assert.equal(cap,trend==='none'?10:trend==='mixed'?40:20);
  for(let seed=1;seed<=80;seed++){
   const a=makeWorksheet(topic,seed,cap,'standard',opts);
   assert.equal(a.problems.length,cap);
   assert.equal(new Set(a.problems.map(p=>JSON.stringify([p.payload.question,p.diagramSpec]))).size,cap);
   assert.deepEqual(a,makeWorksheet(topic,seed,cap,'standard',opts));
  }
 }
});
test('R18: plot mode is encoded in v9 share links',()=>{
 for(const trend of ['mixed','positive','negative','none']){
  const opts={task:'plot',trend},settings={seed:20261105,difficulty:'challenge',quantity:8,paper:'A4',options:normalizeTopicOptions(topic,opts)};
  const link=buildWorksheetLink('https://math-works.pages.dev/scatter-plot-worksheets/',topic,settings);
  assert.equal(new URL(link).searchParams.get('gv'),'9');
  assert.deepEqual(parseWorksheetLink(link,topic),settings);
  assert.deepEqual(makeWorksheet(topic,settings.seed,8,'challenge',opts),makeWorksheet(topic,settings.seed,8,'challenge',parseWorksheetLink(link,topic).options));
 }
});
test('R18: malformed scatter coordinates are rejected',()=>{
 assert.throws(()=>scatterGeometry({kind:'scatter',values:[1,2,2,3]}),/six/);
 assert.throws(()=>scatterGeometry({kind:'scatter',values:[1,2,2,3,3,4,4,5,5,6,6,20]}),/outside/);
});