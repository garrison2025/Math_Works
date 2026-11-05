import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet,GENERATOR_VERSION} from '../src/lib/math.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';

const topic='mean-median-mode-range-worksheets';
function oracle(problem){
 const match=problem.payload.question.match(/^Find the (mean|median|mode|range) of \[([\d, ]+)\]\.$/);
 assert.ok(match,`Unexpected problem: ${problem.payload.question}`);
 const values=match[2].split(', ').map(Number),n=values.length;
 assert.ok(n>=5&&n<=9);
 assert.deepEqual(values,[...values].sort((a,b)=>a-b));
 const counts=new Map();for(const x of values)counts.set(x,(counts.get(x)??0)+1);
 const high=Math.max(...counts.values());
 const modes=high===1?[]:[...counts].filter(([,count])=>count===high).map(([x])=>x).sort((a,b)=>a-b);
 const total=values.reduce((a,b)=>a+b,0);
 const div=(a,b)=>{const gcd=(x,y)=>y?gcd(y,x%y):x;const g=gcd(a,b);return b/g===1?String(a/g):`${a/g}/${b/g}`;};
 const answer=match[1]==='mean'?div(total,n):match[1]==='median'?String(n%2?values[(n-1)/2]:(values[n/2-1]+values[n/2])/2):match[1]==='mode'?(modes.length?modes.join(', '):'no mode'):String(values.at(-1)-values[0]);
 assert.equal(problem.expectedAnswer,answer,`Incorrect answer for ${problem.payload.question}`);
 assert.ok(problem.solutionSteps.some(s=>s.includes(answer)),`Worked solution must include the answer`);
 return {n,modes,high};
}
test('R21: 24,000 distinct independent statistics oracles across all modal patterns and question types',()=>{
 const tasks=['mean','median','mode','range'], patterns=['single','two','none'];
 const parity=new Set();
 for(const pattern of patterns)for(const task of tasks)for(let seed=1;seed<=2000;seed++){
  const difficulty=seed%3===0?'easy':seed%3===1?'standard':'challenge';
  const p=sampleProblem(topic,seed,difficulty,{modePattern:pattern,statistic:task});
  const {n,modes,high}=oracle(p);parity.add(n%2);
  if(pattern==='single'){assert.equal(modes.length,1);assert.equal(high,3);}
  if(pattern==='two'){assert.equal(modes.length,2);assert.equal(high,2);}
  if(pattern==='none'){assert.equal(modes.length,0);assert.equal(high,1);if(task==='mode')assert.equal(p.expectedAnswer,'no mode');}
 }
 assert.deepEqual([...parity].sort(),[0,1],'Both even and odd samples must be represented');
});
test('R21: mixed mode selection and exact non-integer means remain reproducible',()=>{
 assert.equal(GENERATOR_VERSION,'12');
 let fractionCount=0;
 for(let seed=0;seed<1500;seed++){
  const p=sampleProblem(topic,seed,'challenge',{statistic:'mean',modePattern:'mixed'});
  oracle(p);
  if(p.expectedAnswer.includes('/'))fractionCount++;
 }
 assert.ok(fractionCount>700,'Should regularly use exact fractional means');
 for(const pattern of ['mixed','single','two','none']){
  const options={statistic:'mode',modePattern:pattern};
  const sheet=makeWorksheet(topic,20261105,20,'standard',options);
  const link=buildWorksheetLink('https://math-works.pages.dev/mean-median-mode-range-worksheets/',topic,{seed:sheet.seed,difficulty:'standard',quantity:20,paper:'A4',options});
  const parsed=parseWorksheetLink(link,topic);
  assert.equal(new URL(link).searchParams.get('gv'),'12');
  assert.deepEqual(parsed.options,options);
  assert.deepEqual(makeWorksheet(topic,parsed.seed,parsed.quantity,parsed.difficulty,parsed.options),sheet);
  assert.equal(new Set(sheet.problems.map(p=>p.payload.question)).size,20);
 }
});
