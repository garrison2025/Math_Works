import test from 'node:test';
import assert from 'node:assert/strict';
import {GENERATOR_VERSION,sampleProblem,makeWorksheet} from '../src/lib/math.ts';
import {topicOptionsFor,maxQuantityForTopic} from '../src/lib/topic-options.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
import {topicIntro,howTo,commonMistakes} from '../src/lib/site.ts';
const topic='long-division-worksheets';
const problemNumbers=p=>{
 const match=p.payload.question.match(/^(\d+) ÷ (\d+) = ____ \(quotient R remainder\)$/);
 assert.ok(match,`Malformed division question: ${p.payload.question}`);
 const answer=p.expectedAnswer.match(/^(\d+) R (\d+)$/);
 assert.ok(answer,`Malformed quotient/remainder: ${p.expectedAnswer}`);
 return {dividend:Number(match[1]),divisor:Number(match[2]),quotient:Number(answer[1]),remainder:Number(answer[2])};
};

test('R27: 36,000 independently verified division problems for all divisor and dividend sizes',()=>{
 let count=0,zeroInQuotient=0;
 for(const divisorDigits of ['one','two'])
 for(const dividendDigits of ['three','four'])
 for(const remainder of ['no','yes','mixed'])
 for(const difficulty of ['easy','standard','challenge'])
 for(let seed=1;seed<=1000;seed++){
  const p=sampleProblem(topic,seed,difficulty,{divisorDigits,dividendDigits,remainder});
  const {dividend,divisor,quotient,remainder:rest}=problemNumbers(p);
  assert.equal(dividend,divisor*quotient+rest);
  assert.equal(dividend.toString().length,Number(dividendDigits==='three'?3:4));
  assert.ok(divisorDigits==='one'?divisor>=2&&divisor<=9:divisor>=11&&divisor<=49);
  assert.ok(rest>=0&&rest<divisor);
  if(remainder==='yes')assert.ok(rest>0);
  if(remainder==='no')assert.equal(rest,0);
  let carry=0,started=false,actualDigits='';
  for(const [index,digit] of [...String(dividend)].entries()){
    const partial=carry*10+Number(digit),qdigit=Math.trunc(partial/divisor);
    carry=partial%divisor;
    if(qdigit||started){started=true;actualDigits+=String(qdigit);}
    if(!started)assert.match(p.solutionSteps[index],/below .*use the next/);
    else assert.ok(p.solutionSteps[index].includes(`quotient digit ${qdigit};`),`Missing correct quotient digit: ${p.solutionSteps[index]}`);
  }
  assert.equal(Number(actualDigits),quotient,'Incorrect quotient long-division trace');
  assert.equal(carry,rest,'Incorrect final long-division remainder');
  if(actualDigits.includes('0'))zeroInQuotient++;
  assert.deepEqual(p.diagramSpec?.values,[dividend,divisor]);
  const svg=diagramSVG(p.diagramSpec);
  assert.ok(svg.includes(`>${dividend}<`)&&svg.includes(`>${divisor}<`));
  assert.ok(svg.includes('remainder: ______'));
  assert.ok(svg.includes('quotient: ______'),'Question diagram must leave the quotient blank');
  count++;
 }
 assert.equal(count,36000);
 assert.ok(zeroInQuotient>100,'No meaningful testing of zero in intermediate quotient digit');
});

test('R27: 40 questions remain distinct and reproducible in narrow choices',()=>{
 for(const divisorDigits of ['one','two','mixed'])
 for(const dividendDigits of ['three','four','mixed'])
 for(const remainder of ['no','yes','mixed'])
 for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [1,17,74,20261105]){
   const options={divisorDigits,dividendDigits,remainder};
   const sheet=makeWorksheet(topic,seed,40,difficulty,options);
   assert.equal(sheet.problems.length,40);
   assert.equal(new Set(sheet.problems.map(p=>p.payload.question)).size,40);
   assert.deepEqual(sheet,makeWorksheet(topic,seed,40,difficulty,options));
   assert.deepEqual(sheet.answerMap.map(r=>r.answer),sheet.problems.map(p=>p.expectedAnswer));
 }
});

test('R27: share-link and educational text describe real two-digit long division',()=>{
 assert.equal(GENERATOR_VERSION,'18');
 const options={remainder:'yes',divisorDigits:'two',dividendDigits:'four'};
 const config={seed:20261105,difficulty:'challenge',paper:'A4',quantity:20,options};
 const link=buildWorksheetLink(`https://math-works.pages.dev/${topic}/`,topic,config);
 assert.deepEqual(parseWorksheetLink(link,topic),config);
 assert.match(link,/gv=18/);
 assert.match(link,/opt_divisorDigits=two/);
 assert.match(link,/opt_dividendDigits=four/);
 assert.equal(maxQuantityForTopic(topic,options,'challenge'),40);
 assert.equal(topicOptionsFor(topic).length,3);
 assert.match(topicIntro(topic),/two-digit divisors/i);
 assert.match(howTo(topic).join(' '),/zero in the quotient/i);
 assert.match(commonMistakes(topic).join(' '),/zero digit/i);
});
