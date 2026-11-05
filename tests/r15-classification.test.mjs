import test from 'node:test';
import assert from 'node:assert/strict';
import {makeWorksheet,sampleProblem} from '../src/lib/math.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';

const parseSystem=(prompt)=>{
 const m=prompt.match(/^Classify and solve the system: (-?\d+)x ([+−]) (\d+)y = (-?\d+); (-?\d+)x ([+−]) (\d+)y = (-?\d+)\.$/);
 assert.ok(m,`Cannot parse system: ${prompt}`);
 return {a:+m[1],b:+m[3]*(m[2]==='−'?-1:1),c:+m[4],d:+m[5],e:+m[7]*(m[6]==='−'?-1:1),f:+m[8]};
};

test('R15: 24,000 degenerate linear systems classify exactly by independent determinant and augmented rank',()=>{
 for(const method of ['parallel','coincident'])for(let seed=0;seed<12000;seed++){
  const p=sampleProblem('systems-equations-worksheets',seed,'challenge',{method,solutions:'mixed'});
  const {a,b,c,d,e,f}=parseSystem(p.payload.question);
  assert.notEqual(a,0);assert.notEqual(b,0);assert.notEqual(d,0);assert.notEqual(e,0);
  assert.equal(a*e-b*d,0,`coefficient determinant must vanish: ${seed}`);
  const sameLine=a*f===c*d && b*f===c*e;
  assert.equal(sameLine,method==='coincident',`${method} seed ${seed}`);
  assert.equal(p.expectedAnswer,sameLine?'infinitely many solutions':'no solution');
  assert.ok(p.solutionSteps.some(s=>s.includes(p.expectedAnswer)));
 }
});

test('R15: 12,000 function classifications independently check repeated-input contradictions',()=>{
 for(const relation of ['function','not-function'])for(let seed=0;seed<6000;seed++){
  const p=sampleProblem('domain-range-worksheets',seed,'challenge',{task:'function-test',relation});
  assert.match(p.payload.question,/^Is the relation \{.*\} a function\? Answer yes or no\.$/);
  const pairs=[...p.payload.question.matchAll(/\((-?\d+),(-?\d+)\)/g)].map(x=>[+x[1],+x[2]]);
  assert.equal(pairs.length,relation==='function'?3:4);
  let consistent=true;const outputs=new Map();
  for(const [x,y] of pairs){if(outputs.has(x)&&outputs.get(x)!==y)consistent=false;outputs.set(x,y);}
  assert.equal(p.expectedAnswer,consistent?'yes':'no');
  assert.equal(consistent,relation==='function');
 }
});

test('R15: classification modes round-trip links, answer map and generator v9 identity',()=>{
 for(const [slug,options] of [
  ['systems-equations-worksheets',{method:'parallel',solutions:'mixed'}],
  ['systems-equations-worksheets',{method:'coincident',solutions:'mixed'}],
  ['domain-range-worksheets',{task:'function-test',relation:'function'}],
  ['domain-range-worksheets',{task:'function-test',relation:'not-function'}]
 ]){
  const payload={seed:0x98765432,quantity:20,difficulty:'challenge',paper:'A4',options};
  const url=buildWorksheetLink(`https://math-works.pages.dev/${slug}/`,slug,payload);
  assert.equal(new URL(url).searchParams.get('gv'),'9');
  const restored=parseWorksheetLink(url,slug);
  assert.deepEqual(restored,payload);
  const sheet=makeWorksheet(slug,payload.seed,payload.quantity,payload.difficulty,options);
  const rerun=makeWorksheet(slug,restored.seed,restored.quantity,restored.difficulty,restored.options);
  assert.equal(sheet.generatorVersion,'9');assert.deepEqual(sheet.answerMap,rerun.answerMap);
  assert.equal(sheet.optionsHash,rerun.optionsHash);
 }
});
