import test from 'node:test';
import assert from 'node:assert/strict';
import {makeWorksheet,sampleProblem} from '../src/lib/math.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';

const positiveOrNegative=(value,choice)=>choice==='positive'?value>0:choice==='negative'?value<0:true;

test('R14: 12,000 general linear systems have a nonzero determinant and exact unique integer solution',()=>{
 for(const mode of ['mixed','positive','negative'])for(let seed=0;seed<4000;seed++){
  const p=sampleProblem('systems-equations-worksheets',seed,'challenge',{solutions:mode,method:'general'});
  const q=p.payload.question;
  const m=q.match(/^Solve the system: (-?\d+)x ([+−]) (\d+)y = (-?\d+); (-?\d+)x ([+−]) (\d+)y = (-?\d+)\.$/);
  assert.ok(m,`unexpected equation: ${q}`);
  const [a,b,c,d]=[Number(m[1]),Number(m[3])*(m[2]==='−'?-1:1),Number(m[5]),Number(m[7])*(m[6]==='−'?-1:1)];
  const [r,s]=[Number(m[4]),Number(m[8])],det=a*d-b*c;
  assert.notEqual(det,0,'coefficient matrix must be invertible');
  const x=((r*d-b*s)/det)||0,y=((a*s-r*c)/det)||0;
  assert.ok(Number.isSafeInteger(x)&&Number.isSafeInteger(y),'solution must be exact integers');
  assert.ok(positiveOrNegative(x,mode)&&positiveOrNegative(y,mode));
  assert.equal(p.expectedAnswer,`x = ${x}, y = ${y}`);
  assert.equal((a*x+b*y)||0,r||0);assert.equal((c*x+d*y)||0,s||0);
  assert.ok(p.solutionSteps.some(t=>t.includes(`${det}x`)));
 }
});

test('R14: 12,000 relation tasks distinguish functions from non-functions without duplicated set elements',()=>{
 for(const relation of ['function','not-function'])for(const task of ['domain','range'])for(let seed=0;seed<3000;seed++){
  const p=sampleProblem('domain-range-worksheets',seed,'challenge',{relation,task});
  const pairs=[...p.payload.question.matchAll(/\((-?\d+),(-?\d+)\)/g)].map(m=>[+m[1],+m[2]]);
  assert.equal(pairs.length,relation==='function'?3:4);
  const f=new Map();let isFunction=true;
  for(const [x,y] of pairs){if(f.has(x)&&f.get(x)!==y)isFunction=false;f.set(x,y);}
  assert.equal(isFunction,relation==='function');
  const expected=[...new Set(pairs.map(pair=>pair[task==='domain'?0:1]))].sort((a,b)=>a-b);
  assert.equal(p.expectedAnswer,`{${expected.join(', ')}}`);
 }
});

test('R14: multi-option worksheets retain reproducible URL, seeds and answer key identity',()=>{
 for(const [slug,opts] of [
  ['systems-equations-worksheets',{solutions:'negative',method:'general'}],
  ['domain-range-worksheets',{task:'range',relation:'not-function'}]
 ]){
  const args={seed:0xdecafbad,quantity:20,difficulty:'challenge',paper:'A4',options:opts};
  const a=makeWorksheet(slug,args.seed,args.quantity,args.difficulty,args.options);
  const url=buildWorksheetLink(`https://math-works.pages.dev/${slug}/`,slug,args);
  assert.equal(new URL(url).searchParams.get('gv'),'13');
  const restored=parseWorksheetLink(url,slug);
  assert.deepEqual(restored,args);
  const b=makeWorksheet(slug,restored.seed,restored.quantity,restored.difficulty,restored.options);
  assert.deepEqual(a.answerMap,b.answerMap);
  assert.equal(a.generatorVersion,'13');
  assert.equal(a.optionsHash,b.optionsHash);
 }
});
