import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem, makeWorksheet, rational, asText, GENERATOR_VERSION} from '../src/lib/math.ts';
import {buildWorksheetLink, parseWorksheetLink} from '../src/lib/worksheet-link.ts';
import {topicIntro, howTo, commonMistakes} from '../src/lib/site.ts';

const topic='percentages-worksheets';
const modes=['fraction-to-percent','percent-to-fraction','percent-of-number','percent-change'];

/** Independently parse the visible question; never trust a hidden answer field. */
function independentAnswer(question){
 let m=question.match(/^Convert (\d+)\/(\d+) into a percentage\.$/);
 if(m){const cents=BigInt(m[1])*100n, d=BigInt(m[2]);
  assert.equal(cents*100n%d,0n,'Only terminating hundredth-percent examples are expected');
  return `${Number(cents)/Number(d)}%`;
 }
 m=question.match(/^Convert (\d+(?:\.\d+)?)% into a fraction in simplest form\.$/);
 if(m){const digits=(m[1].split('.')[1]??'').length;
  return asText(rational(BigInt(m[1].replace('.','')),100n*10n**BigInt(digits)));
 }
 m=question.match(/^Find (\d+)% of (\d+)\.$/);
 if(m){const cents=BigInt(m[1])*BigInt(m[2]);
  const whole=cents/100n, remainder=cents%100n;
  return remainder===0n?String(whole):`${whole}.${remainder.toString().padStart(2,'0').replace(/0$/,'')}`;
 }
 m=question.match(/^Find the percentage (increase|decrease) from (\d+) to (\d+)\.$/);
 if(m){const start=BigInt(m[2]),end=BigInt(m[3]);assert.ok(start>0n);
  const delta=end>start?end-start:start-end;
  assert.equal(delta*100n%start,0n,'Percent changes must be exactly representable');
  assert.equal(end>start?'increase':'decrease',m[1]);
  return `${delta*100n/start}%`;
 }
 throw Error(`Unrecognized percentage prompt ${question}`);
}

test('R23: 18,000 independent percentage conversions, of-number and percent-change oracles',()=>{
 let count=0, decimals=0, decreases=0, increases=0;
 for(const direction of modes)for(const difficulty of ['easy','standard','challenge'])for(let seed=1;seed<=1500;seed++){
  const p=sampleProblem(topic,seed,difficulty,{direction});
  assert.equal(p.expectedAnswer,independentAnswer(p.payload.question),`${direction}/${difficulty}/${seed}: ${p.payload.question}`);
  assert.ok(p.solutionSteps.length>=2);
  if(direction==='percent-of-number'){
   assert.match(p.solutionSteps[0],/means \d+\/100/);
   if(p.expectedAnswer.includes('.'))decimals++;
  }
  if(direction==='percent-change'){
   assert.match(p.solutionSteps.join(' '),/original value/iu,'Percentage change steps must say which denominator to use');
   if(p.payload.question.includes('increase'))increases++;else decreases++;
  }
  count++;
 }
 assert.equal(count,18000);
 assert.ok(decimals>400,'Need meaningful exact-decimal practice');
 assert.ok(increases>500&&decreases>500,'Both directions must be used');
});

test('R23: mixed mode actually covers all four percentage skills',()=>{
 const kinds=new Set();
 for(let seed=0;seed<800;seed++){
  const q=sampleProblem(topic,seed,'standard',{direction:'mixed'}).payload.question;
  if(q.includes('into a percentage'))kinds.add('fraction-to-percent');
  else if(q.includes('into a fraction'))kinds.add('percent-to-fraction');
  else if(q.startsWith('Find the percentage'))kinds.add('percent-change');
  else if(q.startsWith('Find '))kinds.add('percent-of-number');
 }
 assert.deepEqual([...kinds].sort(),[...modes].sort());
});

test('R23: all four selectors generate 40 distinct problems with roundtrip share identity',()=>{
 assert.equal(GENERATOR_VERSION,'14');
 for(const direction of ['mixed',...modes])for(const seed of [1,5,54,215,20261105]){
  const options={direction};
  const set=makeWorksheet(topic,seed,40,'challenge',options);
  assert.equal(set.problems.length,40);
  assert.equal(new Set(set.problems.map(p=>p.payload.question)).size,40);
  assert.deepEqual(makeWorksheet(topic,seed,40,'challenge',options),set);
  assert.deepEqual(set.answerMap.map(row=>row.answer),set.problems.map(p=>p.expectedAnswer));
  const url=buildWorksheetLink(`https://math-works.pages.dev/${topic}/`,topic,{seed,quantity:40,difficulty:'challenge',paper:'A4',options});
  assert.equal(new URL(url).searchParams.get('gv'),'14');
  assert.deepEqual(parseWorksheetLink(url,topic).options,options);
 }
});

test('R23: lesson content distinguishes original vs new value and exact arithmetic',()=>{
 assert.match(topicIntro(topic),/increase and decrease/);
 assert.match(howTo(topic).join(' '),/ORIGINAL value/);
 assert.match(commonMistakes(topic).join(' '),/original value/);
});
