import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet,GENERATOR_VERSION} from '../src/lib/math.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
import {normalizeTopicOptions,maxQuantityForTopic} from '../src/lib/topic-options.ts';
import {hasVerifiedSteps} from '../src/lib/capabilities.ts';
import {topicIntro,howTo,commonMistakes} from '../src/lib/site.ts';

const topic='fractions-worksheets';
const operations={addition:'+',subtraction:'−',multiplication:'×',division:'÷'};
const denominatorModes=['same','unlike','mixed'];
const gcd=(a,b)=>b===0n?(a<0n?-a:a):gcd(b,a%b);
function reduce(n,d){assert.notEqual(d,0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return d/g===1n?String(n/g):`${n/g}/${d/g}`;}
function readQuestion(q){const match=q.match(/^(\d+)\/(\d+) ([+−×÷]) (\d+)\/(\d+) = ____$/);assert.ok(match,`Malformed fraction question: ${q}`);return {n:BigInt(match[1]),d:BigInt(match[2]),op:match[3],v:BigInt(match[4]),e:BigInt(match[5])};}
function oracle({n,d,op,v,e}){
 if(op==='+')return reduce(n*e+v*d,d*e);
 if(op==='−')return reduce(n*e-v*d,d*e);
 if(op==='×')return reduce(n*v,d*e);
 if(op==='÷')return reduce(n*e,d*v);
 throw Error(`Unsupported fraction operation ${op}`);
}

test('R24: 18,000 independent exact fraction arithmetic oracles, including division and unlike denominators',()=>{
 let total=0,negatives=0;
 for(const [operation,symbol] of Object.entries(operations))
  for(const denominators of denominatorModes)
   for(const difficulty of ['easy','standard','challenge'])
    for(let seed=1;seed<=500;seed++){
     const p=sampleProblem(topic,seed,difficulty,{operation,denominators});
     const parsed=readQuestion(p.payload.question);
     assert.equal(parsed.op,symbol);
     assert.ok(parsed.d>=2n&&parsed.e>=2n&&parsed.v!==0n);
     if(denominators==='same')assert.equal(parsed.d,parsed.e);
     if(denominators==='unlike')assert.notEqual(parsed.d,parsed.e);
     assert.equal(p.expectedAnswer,oracle(parsed),`${operation}/${denominators}/${difficulty}/${seed}`);
     assert.ok(p.solutionSteps.length>=3);
     if(operation==='division'){
      assert.match(p.solutionSteps[0],/reciprocal/i);
      assert.match(p.solutionSteps.join(' '),new RegExp(`${parsed.e}/${parsed.v}`));
     }
     if(operation==='addition'||operation==='subtraction'){
      const common=parsed.d*parsed.e/gcd(parsed.d,parsed.e);
      assert.ok(p.solutionSteps[0].includes(`denominator ${common}`));
     }
     if(p.expectedAnswer.startsWith('-'))negatives++;
     total++;
    }
 assert.equal(total,18000);
 assert.ok(negatives>300,'Subtraction practice must include negative results');
});

test('R24: 40-question sheets remain unique, repeatable, with exact answer keys',()=>{
 for(const operation of ['mixed',...Object.keys(operations)])for(const denominators of denominatorModes){
  const opts={operation,denominators};
  assert.ok(maxQuantityForTopic(topic,opts,'challenge')>=40);
  for(const seed of [0,3,44,20261105]){
   const a=makeWorksheet(topic,seed,40,'challenge',opts);
   const b=makeWorksheet(topic,seed,40,'challenge',opts);
   assert.deepEqual(a,b);
   assert.equal(a.problems.length,40);
   assert.equal(new Set(a.problems.map(p=>p.payload.question)).size,40);
   a.problems.forEach((p,i)=>{
    assert.equal(p.expectedAnswer,oracle(readQuestion(p.payload.question)));
    assert.equal(a.answerMap[i].answer,p.expectedAnswer);
   });
  }
 }
});

test('R24: new settings survive share links and distinguish the PDF configuration',()=>{
 assert.equal(GENERATOR_VERSION,'17');
 assert.ok(hasVerifiedSteps(topic));
 const signatures=new Set();
 for(const operation of ['mixed',...Object.keys(operations)])for(const denominators of denominatorModes){
  const options={operation,denominators};
  const parameters={seed:20261105,quantity:20,difficulty:'standard',paper:'A4',options};
  const url=buildWorksheetLink(`https://math-works.pages.dev/${topic}/`,topic,parameters);
  assert.equal(new URL(url).searchParams.get('gv'),'17');
  assert.deepEqual(parseWorksheetLink(url,topic),{...parameters,options:normalizeTopicOptions(topic,options)});
  const hash=makeWorksheet(topic,parameters.seed,parameters.quantity,parameters.difficulty,options).optionsHash;
  assert.ok(!signatures.has(hash));signatures.add(hash);
 }
 assert.equal(signatures.size,15);
 assert.match(topicIntro(topic),/division/i);
 assert.match(howTo(topic).join(' '),/reciprocal/i);
 assert.match(commonMistakes(topic).join(' '),/divisor/i);
});
