import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet,rational,asText,GENERATOR_VERSION} from '../src/lib/math.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
import {howTo,commonMistakes,topicIntro} from '../src/lib/site.ts';

const topic='mean-absolute-deviation-worksheets';
const parse=(p)=>{
 const match=p.payload.question.match(/^Find the mean absolute deviation of \[([\d, ]+)\]\.$/);
 assert.ok(match,`Unrecognized MAD question: ${p.payload.question}`);
 return match[1].split(', ').map(Number);
};
const oracle=(values)=>{
 const n=values.length,total=values.reduce((a,b)=>a+b,0);
 return {mean:asText(rational(BigInt(total),BigInt(n))),
  mad:asText(rational(BigInt(values.reduce((sum,value)=>sum+Math.abs(n*value-total),0)),BigInt(n*n)))};
};

test('R22: 18,000 independent MAD oracles for balanced and skewed samples of 5, 6 and 8',()=>{
 let fractionalMeans=0,all=0;
 for(const distribution of ['symmetric','skewed'])for(const size of ['5','6','8'])for(let seed=1;seed<=3000;seed++){
  const difficulty=['easy','standard','challenge'][seed%3];
  const p=sampleProblem(topic,seed,difficulty,{distribution,size});
  const values=parse(p),{mean,mad}=oracle(values);
  assert.equal(values.length,Number(size));
  assert.deepEqual(values,[...values].sort((a,b)=>a-b),'observations must be in order');
  assert.equal(p.expectedAnswer,mad,`${distribution}/${size} seed ${seed}`);
  assert.ok(p.solutionSteps[0].includes(`= ${mean}`),'mean step needs exact rational value');
  assert.ok(p.solutionSteps.at(-1).endsWith(`= ${mad}.`),'final step must use exact MAD');
  assert.equal(p.solutionSteps.length,4);
  const numericMean=values.reduce((a,b)=>a+b,0)/values.length;
  const symmetric=values.every((value,i)=>Math.abs(value+values[values.length-i-1]-2*numericMean)<1e-9);
  assert.equal(symmetric,distribution==='symmetric',`distribution does not match ${distribution} seed ${seed}`);
  if(mean.includes('/'))fractionalMeans++;
  all++;
 }
 assert.equal(all,18000);
 assert.ok(fractionalMeans>3000,'Need meaningful practice with fractional sample means');
});

test('R22: 40-question print sets are distinct and reproducible for every sample size',()=>{
 for(const distribution of ['symmetric','skewed'])for(const size of ['mixed','5','6','8'])for(const seed of [1,15,87,20261105]){
  const options={distribution,size};
  const worksheet=makeWorksheet(topic,seed,40,'standard',options);
  assert.equal(worksheet.problems.length,40);
  assert.equal(new Set(worksheet.problems.map(p=>p.payload.question)).size,40);
  assert.deepEqual(makeWorksheet(topic,seed,40,'standard',options),worksheet);
  const url=buildWorksheetLink('https://math-works.pages.dev/mean-absolute-deviation-worksheets/',topic,{seed,quantity:40,difficulty:'standard',paper:'A4',options});
  assert.equal(new URL(url).searchParams.get('gv'),GENERATOR_VERSION);
  assert.deepEqual(parseWorksheetLink(url,topic).options,options);
 }
});

test('R22: teaching notes teach exact nonrounded MAD, and new engine version is recorded',()=>{
 assert.equal(GENERATOR_VERSION,'16');
 assert.match(topicIntro(topic),/5, 6 or 8/);
 assert.match(howTo(topic).join(' '),/exact mean/i);
 assert.match(commonMistakes(topic).join(' '),/Rounding a fractional mean/i);
});
