import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleProblem,makeWorksheet,GENERATOR_VERSION} from '../src/lib/math.ts';
import {maxQuantityForTopic} from '../src/lib/topic-options.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
import {topicIntro,howTo,commonMistakes} from '../src/lib/site.ts';
import {evaluateOrderExpression} from './r26-order-oracle.mjs';
const topic='order-of-operations-worksheets';

test('R26: 27,000 independent order-of-operations checks across all new selectors',()=>{
 let count=0,negative=0;
 for(const skill of ['multiplication','division','powers'])
 for(const grouping of ['mixed','parentheses','no-parentheses'])
 for(const difficulty of ['easy','standard','challenge'])
 for(let seed=1;seed<=1000;seed++){
  const p=sampleProblem(topic,seed,difficulty,{skill,grouping});
  const q=p.payload.question;
  assert.equal(p.expectedAnswer,evaluateOrderExpression(q),`${skill} / ${grouping} / ${difficulty} / ${seed}: ${q}`);
  assert.equal(q.startsWith('('),grouping==='mixed'?q.startsWith('('):grouping==='parentheses');
  assert.ok(skill!=='division'||q.includes(' ÷ '));
  assert.ok(skill!=='powers'||q.includes('²'));
  assert.ok(skill!=='multiplication'||(!q.includes('²')&&!q.includes(' ÷ ')));
  assert.ok(p.solutionSteps.length>=3,'Missing worked intermediate computation');
  if(Number(p.expectedAnswer)<0)negative++;
  count++;
 }
 assert.equal(count,27000);
 assert.ok(negative>=0);
});

test('R26: 40-problem worksheets remain unique in all narrow modes',()=>{
 for(const skill of ['mixed','multiplication','division','powers'])
 for(const grouping of ['mixed','parentheses','no-parentheses'])
 for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [1,74,20261105,4294967295]){
  const options={skill,grouping};
  assert.equal(maxQuantityForTopic(topic,options,difficulty),40);
  const worksheet=makeWorksheet(topic,seed,40,difficulty,options);
  assert.equal(new Set(worksheet.problems.map(p=>p.payload.question)).size,40);
  assert.ok(worksheet.problems.every(p=>p.expectedAnswer===evaluateOrderExpression(p.payload.question)));
  assert.deepEqual(worksheet,makeWorksheet(topic,seed,40,difficulty,options));
  assert.deepEqual(worksheet.answerMap.map(r=>r.answer),worksheet.problems.map(p=>p.expectedAnswer));
 }
});

test('R26: new modes are truly distinct and share-links preserve skill and grouping',()=>{
 assert.equal(GENERATOR_VERSION,'16');
 const config={seed:20261105,difficulty:'challenge',paper:'A4',quantity:20,options:{skill:'powers',grouping:'parentheses'}};
 const link=buildWorksheetLink(`https://math-works.pages.dev/${topic}/`,topic,config);
 assert.deepEqual(parseWorksheetLink(link,topic),config);
 assert.match(link,/opt_skill=powers/);
 assert.match(link,/opt_grouping=parentheses/);
 assert.match(link,/gv=16/);
 const a=makeWorksheet(topic,144,8,'standard',{skill:'powers',grouping:'parentheses'});
 const b=makeWorksheet(topic,144,8,'standard',{skill:'division',grouping:'parentheses'});
 assert.notEqual(a.optionsHash,b.optionsHash);
 assert.ok(a.problems.every(p=>p.payload.question.includes('²')));
 assert.ok(b.problems.every(p=>p.payload.question.includes('÷')));
 assert.match(topicIntro(topic),/squares/i);
 assert.match(howTo(topic).join(' '),/exponents/);
 assert.match(commonMistakes(topic).join(' '),/division/);
});
