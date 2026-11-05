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
function reduce(n,d){assert.notEqual(d,0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return d/g===1n?String(n/g):String(n/g)+'/'+String(d/g);}
function readQuestion(q){
 const m=q.match(/^(\d+)\/(\d+) ([+−×÷]) (\d+)\/(\d+) = ____$/);
 assert.ok(m,'Malformed fraction question: '+q);
 return {n:BigInt(m[1]),d:BigInt(m[2]),op:m[3],v:BigInt(m[4]),e:BigInt(m[5])};
}
function oracle({n,d,op,v,e}){
 if(op==='+')return reduce(n*e+v*d,d*e);
 if(op==='−')return reduce(n*e-v*d,d*e);
 if(op==='×')return reduce(n*v,d*e);
 if(op==='÷')return reduce(n*e,d*v);
 throw Error('Unsupported fraction operation');
}
test('R24: 18,000 independent exact fraction arithmetic oracles',()=>{
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
     assert.equal(p.expectedAnswer,oracle(parsed));
     assert.ok(p.solutionSteps.length>=3);
     if(operation==='division')assert.match(p.solutionSteps.join(' '),/reciprocal/i);
     if(operation==='addition'||operation==='subtraction'){
      const common=parsed.d*parsed.e/gcd(parsed.d,parsed.e);
      assert.ok(p.solutionSteps[0].includes('denominator '+common));
     }
     if(p.expectedAnswer.startsWith('-'))negatives++;
     total++;
    }
 assert.equal(total,18000);
 assert.ok(negatives>300);
});
test('R24: 40-question worksheets are unique and repeatable with matching answers',()=>{
 for(const operation of ['mixed',...Object.keys(operations)])for(const denominators of denominatorModes){
  const options={operation,denominators};
  assert.ok(maxQuantityForTopic(topic,options,'challenge')>=40);
  for(const seed of [0,3,44,20261105]){
   const a=makeWorksheet(topic,seed,40,'challenge',options);
   assert.deepEqual(makeWorksheet(topic,seed,40,'challenge',options),a);
   assert.equal(a.problems.length,40);
   assert.equal(new Set(a.problems.map(p=>p.payload.question)).size,40);
   a.problems.forEach((p,i)=>{
    assert.equal(p.expectedAnswer,oracle(readQuestion(p.payload.question)));
    assert.equal(a.answerMap[i].answer,p.expectedAnswer);
   });
  }
 }
});
test('R24: denominator settings are versioned and share/steps identities align',()=>{
 assert.equal(GENERATOR_VERSION,'14');
 assert.ok(hasVerifiedSteps(topic));
 const signatures=new Set();
 for(const operation of ['mixed',...Object.keys(operations)])for(const denominators of denominatorModes){
  const options={operation,denominators},params={seed:20261105,quantity:20,difficulty:'standard',paper:'A4',options};
  const url=buildWorksheetLink('https://math-works.pages.dev/'+topic+'/',topic,params);
  assert.equal(new URL(url).searchParams.get('gv'),'14');
  assert.deepEqual(parseWorksheetLink(url,topic),{...params,options:normalizeTopicOptions(topic,options)});
  const hash=makeWorksheet(topic,params.seed,params.quantity,params.difficulty,options).optionsHash;
  assert.ok(!signatures.has(hash));signatures.add(hash);
 }
 assert.equal(signatures.size,15);
 assert.match(topicIntro(topic),/division/i);
 assert.match(howTo(topic).join(' '),/reciprocal/i);
 assert.match(commonMistakes(topic).join(' '),/divisor/i);
});
