import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet,GENERATOR_VERSION} from '../src/lib/math.ts';
import {topicOptionsFor} from '../src/lib/topic-options.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
import {commaNumber,integerDigitValue,decimalDigitValue,roundFourPlaceDecimal,fourPlaceDecimal} from '../src/lib/place-value.ts';
import {howTo,topicIntro,commonMistakes} from '../src/lib/site.ts';
const places={ones:1n,tens:10n,hundreds:100n,thousands:1000n,millions:1000000n,billions:1000000000n};
const decimalIndexes={tenths:0,hundredths:1,thousandths:2};

function independentWholeOracle(problem,task,place){
 const match=problem.payload.question.match(/^(What digit is in|What is the value of) the (ones|tens|hundreds|thousands|millions|billions) (?:place|digit) (?:of|in) ([\d,]+)\?$/);
 assert.ok(match,`Bad whole-number question: ${problem.payload.question}`);
 const [_,verb,actualPlace,digits]=match;
 assert.equal(actualPlace,place);
 assert.equal(verb,task==='digit'?'What digit is in':'What is the value of');
 const whole=BigInt(digits.replaceAll(',',''));
 const digit=(whole/places[place])%10n;
 return task==='digit'?String(digit):String(digit*places[place]);
}

function independentDecimalOracle(problem,task,place){
 const question=problem.payload.question;
 const match=question.match(/(\d+)\.(\d{4})/);
 assert.ok(match,`No four-place decimal: ${question}`);
 const number=match[0], fraction=match[2];
 const index=decimalIndexes[place];
 assert.ok(question.includes(task==='round'?`nearest ${place}`:`the ${place} `),`Wrong requested place: ${question}`);
 if(task==='digit'){
  assert.match(question,/^What digit is in/);
  return fraction[index];
 }
 if(task==='value'){
  assert.match(question,/^What is the value of/);
  return Number(fraction[index])===0?'0':`0.${'0'.repeat(index)}${fraction[index]}`;
 }
 assert.match(question,/^Round /);
 const digits=index+1;
 const raw=BigInt(match[1])*10000n+BigInt(fraction),unit=10n**BigInt(4-digits);
 const rounded=((raw+unit/2n)/unit)*unit;
 const whole=rounded/10000n,part=String(rounded%10000n).padStart(4,'0').slice(0,digits);
 return `${whole}.${part}`;
}

test('R28: exact decimal position and half-up rounding, including carry across whole number',()=>{
 assert.equal(roundFourPlaceDecimal(9,9995,'thousandths'),'10.000');
 assert.equal(roundFourPlaceDecimal(9,9999,'hundredths'),'10.00');
 assert.equal(roundFourPlaceDecimal(0,9499,'tenths'),'0.9');
 assert.equal(roundFourPlaceDecimal(0,9500,'tenths'),'1.0');
 assert.equal(roundFourPlaceDecimal(28,4450,'hundredths'),'28.45');
 assert.equal(roundFourPlaceDecimal(0,4,'thousandths'),'0.000');
 assert.equal(fourPlaceDecimal(5,7),'5.0007');
 assert.deepEqual(decimalDigitValue(9,'hundredths'),{digit:0,value:'0',nextDigit:0});
 assert.deepEqual(integerDigitValue(8100004309,'billions'),{digit:8,value:8000000000});
 assert.equal(commaNumber(8100004309),'8,100,004,309');
});

test('R28: 18,000 independent whole-number digit/value oracles through billions',()=>{
 let total=0;
 for(const place of Object.keys(places))for(const task of ['digit','value'])for(const difficulty of ['easy','standard','challenge'])for(let seed=1;seed<=500;seed++){
  const p=sampleProblem('place-value-worksheets',seed,difficulty,{place,task});
  assert.equal(p.expectedAnswer,independentWholeOracle(p,task,place));
  assert.ok(p.solutionSteps.some(step=>step.includes(String(p.expectedAnswer))||step.includes(commaNumber(Number(p.expectedAnswer)))));
  total++;
 }
 assert.equal(total,18000);
});

test('R28: 13,500 independent exact decimal position, value and rounding oracles',()=>{
 let total=0;
 for(const place of Object.keys(decimalIndexes))for(const task of ['digit','value','round'])for(const difficulty of ['easy','standard','challenge'])for(let seed=1;seed<=500;seed++){
  const p=sampleProblem('decimal-place-value-worksheets',seed,difficulty,{place,task});
  assert.equal(p.expectedAnswer,independentDecimalOracle(p,task,place));
  assert.ok(p.solutionSteps.length>=2);
  total++;
 }
 assert.equal(total,13500);
});

test('R28: 40 distinct exercises and exact replay for each narrow place/task selection',()=>{
 for(const [topic,selectedPlaces,skills] of [
  ['place-value-worksheets',Object.keys(places),['digit','value']],
  ['decimal-place-value-worksheets',Object.keys(decimalIndexes),['digit','value','round']]
 ])for(const place of selectedPlaces)for(const task of skills)for(const difficulty of ['easy','standard','challenge'])for(const seed of [1,16,20261105]){
  const options={place,task};
  const worksheet=makeWorksheet(topic,seed,40,difficulty,options);
  assert.equal(worksheet.problems.length,40);
  assert.equal(new Set(worksheet.problems.map(p=>p.payload.question)).size,40);
  assert.deepEqual(worksheet,makeWorksheet(topic,seed,40,difficulty,options));
  assert.deepEqual(worksheet.answerMap,worksheet.problems.map(({id,expectedAnswer})=>({id,answer:expectedAnswer})));
 }
});

test('R28: share links, choice definitions, version, and topic-specific educational copy',()=>{
 assert.equal(GENERATOR_VERSION,'18');
 assert.equal(topicOptionsFor('place-value-worksheets').length,2);
 assert.equal(topicOptionsFor('decimal-place-value-worksheets').length,2);
 for(const [topic,options] of [
  ['place-value-worksheets',{place:'billions',task:'value'}],
  ['decimal-place-value-worksheets',{place:'thousandths',task:'round'}]
 ]){
  const config={seed:20261105,quantity:20,difficulty:'challenge',paper:'A4',options};
  const href=buildWorksheetLink(`https://math-works.pages.dev/${topic}/`,topic,config);
  assert.equal(new URL(href).searchParams.get('gv'),'18');
  assert.deepEqual(parseWorksheetLink(href,topic),config);
  assert.match(topicIntro(topic),/place/i);
  assert.match(howTo(topic).join(' '),/place/i);
  assert.ok(commonMistakes(topic).length>=2);
 }
});
