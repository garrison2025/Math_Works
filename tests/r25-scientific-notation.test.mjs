import test from 'node:test';
import assert from 'node:assert/strict';
import {scientificNotationPair} from '../src/lib/scientific-notation.ts';
import {sampleProblem,makeWorksheet,GENERATOR_VERSION} from '../src/lib/math.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
import {topicIntro,howTo,commonMistakes} from '../src/lib/site.ts';
const slug='scientific-notation-worksheets';
// Oracles derive the mantissa and exponent from characters in the ACTUAL question.
// Neither of these functions calls the production formatter or hidden answer data.
function normalizedScientific(standard){
 const segments=standard.split('.');const digits=segments.join('');
 const start=digits.search(/[1-9]/);assert.ok(start>=0,'No zero-value exercises');
 const significant=digits.slice(start).replace(/0+$/,'');
 assert.ok(significant.length>=2 && significant.length<=4);
 return `${significant[0]}.${significant.slice(1)} × 10^${segments[0].length-start-1}`;
}
function normalizedStandard(coefficient,power){
 const parts=coefficient.split('.');
 const integer=BigInt(parts.join(''));
 const shift=power-(parts[1]?.length??0);
 if(shift>=0)return String(integer*10n**BigInt(shift));
 const s=String(integer),point=s.length+shift;
 return point>0?s.slice(0,point)+'.'+s.slice(point):'0.'+'0'.repeat(-point)+s;
}
function oracle(question){
 const toScientific=question.match(/^Write (\d+(?:\.\d+)?) in scientific notation\.$/);
 if(toScientific)return normalizedScientific(toScientific[1]);
 const toStandard=question.match(/^Write (\d+\.\d+) × 10\^(-?\d+) in standard form\.$/);
 assert.ok(toStandard,`Unrecognized scientific notation task: ${question}`);
 return normalizedStandard(toStandard[1],Number(toStandard[2]));
}

test('R25 exact formatter handles small negative powers, zero exponent and large integers',()=>{
 assert.deepEqual(scientificNotationPair(1234,4,-8),{coefficient:'1.234',standard:'0.00000001234'});
 assert.deepEqual(scientificNotationPair(124,3,0),{coefficient:'1.24',standard:'1.24'});
 assert.deepEqual(scientificNotationPair(1234,4,8),{coefficient:'1.234',standard:'123400000'});
 assert.deepEqual(scientificNotationPair(105,3,-1),{coefficient:'1.05',standard:'0.105'});
 for(const args of [[100,3,2],[12,5,3],[11,2,9],[9,2,3],[-123,3,2]])assert.throws(()=>scientificNotationPair(...args));
});

test('R25 27,000 independent scientific notation oracles across modes and difficulty',()=>{
 let count=0,positive=0,negative=0,zero=0,smalls=0;
 for(const direction of ['to-scientific','to-standard'])
 for(const sign of ['positive','negative','mixed'])
 for(const precision of ['2','3','4'])
 for(const difficulty of ['easy','standard','challenge'])
 for(let seed=1;seed<=500;seed++){
  const p=sampleProblem(slug,seed,difficulty,{direction,exponentSign:sign,significantDigits:precision});
  const q=p.payload.question;
  assert.equal(p.expectedAnswer,oracle(q),`${direction}/${sign}/${precision}/${difficulty}/${seed}: ${q}`);
  const formula=q.match(/(\d+\.\d+) × 10\^(-?\d+)/)??p.expectedAnswer.match(/(\d+\.\d+) × 10\^(-?\d+)/);
  assert.ok(formula,q);const exponent=Number(formula[2]);
  assert.equal(formula[1].replace('.','').length,Number(precision));
  if(sign==='positive')assert.ok(exponent>0);
  if(sign==='negative')assert.ok(exponent<0);
  if(exponent>0)positive++;else if(exponent<0)negative++;else zero++;
  if(q.includes('0.0000000'))smalls++;
  assert.ok(p.solutionSteps.length>=2);
  count++;
 }
 assert.equal(count,27000);assert.ok(positive>3000&&negative>3000&&zero>0&&smalls>0);
});

test('R25 40-question sheets never collapse to repeated scientific notation questions',()=>{
 for(const direction of ['to-scientific','to-standard','mixed'])
 for(const sign of ['positive','negative','mixed'])
 for(const precision of ['2','3','4','mixed'])
 for(const seed of [1,74,20261105]){
  const opts={direction,exponentSign:sign,significantDigits:precision};
  const sheet=makeWorksheet(slug,seed,40,'easy',opts);
  assert.equal(sheet.problems.length,40);
  assert.equal(new Set(sheet.problems.map(p=>p.payload.question)).size,40);
  assert.deepEqual(makeWorksheet(slug,seed,40,'easy',opts),sheet);
  assert.deepEqual(sheet.answerMap.map(r=>r.answer),sheet.problems.map(p=>p.expectedAnswer));
 }
});

test('R25 share links encode all three scientific notation selectors and a new version',()=>{
 assert.equal(GENERATOR_VERSION,'18');
 const opts={direction:'to-standard',exponentSign:'negative',significantDigits:'4'};
 const settings={seed:4257,difficulty:'challenge',paper:'A4',quantity:20,options:opts};
 const url=buildWorksheetLink(`https://math-works.pages.dev/${slug}/`,slug,settings);
 assert.equal(new URL(url).searchParams.get('gv'),'18');
 assert.deepEqual(parseWorksheetLink(url,slug),settings);
 assert.match(url,/opt_exponentSign=negative/);
 assert.match(url,/opt_significantDigits=4/);
 assert.match(topicIntro(slug),/negative exponents/);
 assert.match(howTo(slug).join(' '),/significant digits/);
 assert.match(commonMistakes(slug).join(' '),/zero/);
});
