import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet,GENERATOR_VERSION} from '../src/lib/math.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {maxQuantityForTopic} from '../src/lib/topic-options.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
const topic='pythagorean-worksheets';
test('R19: independent Pythagorean checks over 18,000 task/difficulty/seed trials',()=>{
 for(const task of ['hypotenuse','missing-leg','mixed'])for(const difficulty of ['easy','standard','challenge'])for(let seed=1;seed<=2000;seed++){
  const p=sampleProblem(topic,seed,difficulty,{task}),d=p.diagramSpec,[a,b,c]=d.values;
  assert.equal(d.kind,'right-triangle');
  if(task==='hypotenuse'||(task==='mixed'&&p.payload.question.includes('Find its hypotenuse.'))){
   const nums=p.payload.question.match(/[0-9]+/g);
   assert.deepEqual([a,b],[Number(nums[0]),Number(nums[1])]);
   assert.equal(Number(p.expectedAnswer),Math.sqrt(a*a+b*b));assert.equal(c,undefined);
  }else{
   const nums=p.payload.question.match(/[0-9]+/g),hyp=Number(nums[0]),known=Number(nums[1]),unknown=Number(p.expectedAnswer);
   assert.equal(c,hyp);assert.equal(a*a+b*b,c*c);assert.equal(unknown*unknown,c*c-known*known);
   assert.equal(d.labels[0],unknown===a?'missing-base':'missing-vertical');
   const question=diagramSVG(d),answer=diagramSVG(d,true);
   assert.match(question,/>[?] units<[/]text>/);
   assert.doesNotMatch(question,new RegExp('>'+unknown+' units<'));
   assert.doesNotMatch(answer,/>[?] units<[/]text>/);
   assert.match(answer,new RegExp('>'+unknown+' units<'));
  }
 }
});
test('R19: missing-side modes stay unique, deterministic and reproducible through URLs',()=>{
 for(const difficulty of ['easy','standard','challenge'])for(const scale of ['mixed','small','large'])for(const task of ['hypotenuse','missing-leg','mixed'])for(const seed of [1,2,17,20261105]){
  const options={scale,task},cap=maxQuantityForTopic(topic,options,difficulty),quantity=Math.min(cap,16),sheet=makeWorksheet(topic,seed,quantity,difficulty,options);
  assert.equal(sheet.problems.length,quantity);
  assert.equal(new Set(sheet.problems.map(p=>p.payload.question)).size,quantity);
  const url=buildWorksheetLink('https://math-works.pages.dev/pythagorean-worksheets/',topic,{seed,difficulty,quantity:8,paper:'A4',options});
  const parsed=parseWorksheetLink(url,topic);
  assert.equal(new URL(url).searchParams.get('gv'),GENERATOR_VERSION);
  assert.deepEqual(parsed.options,options);
  assert.deepEqual(makeWorksheet(topic,seed,8,difficulty,options),makeWorksheet(topic,parsed.seed,8,parsed.difficulty,parsed.options));
 }
});