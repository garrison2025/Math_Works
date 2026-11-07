import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {assertWorksheetMath} from '../src/lib/math-release-oracle.ts';
import {assertWorksheetSteps,INDEPENDENT_STEP_TOPICS} from '../src/lib/step-release-oracle.ts';
import {verifiedStepTopics} from '../src/lib/capabilities.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';

const options={
 'one-step-equations-worksheets':[
  {operation:'addition'},{operation:'multiplication'}],
 'order-of-operations-worksheets':[
  {skill:'multiplication',grouping:'parentheses'},
  {skill:'multiplication',grouping:'no-parentheses'},
  {skill:'division',grouping:'parentheses'},
  {skill:'division',grouping:'no-parentheses'},
  {skill:'powers',grouping:'parentheses'},
  {skill:'powers',grouping:'no-parentheses'}],
 'equivalent-fractions-worksheets':[
  {missing:'numerator'},{missing:'denominator'}],
 'pythagorean-worksheets':[
  {task:'hypotenuse',scale:'small'},{task:'missing-leg',scale:'large'}],
 'area-of-triangles-worksheets':[
  {task:'area'},{task:'missing-height'}],
 'area-of-parallelograms-worksheets':[
  {task:'area'},{task:'missing-height'}],
 'area-of-trapezoids-worksheets':[
  {task:'area',baseRelation:'inclusive'},
  {task:'missing-height',baseRelation:'unequal'}]
};
const newTopics=Object.keys(options);
test('R51: every authorized PDF worked-step topic has independent arithmetic reconstruction',()=>{
 const enabled=verifiedStepTopics();
 assert.ok(enabled.length>=23);
 assert.deepEqual([...INDEPENDENT_STEP_TOPICS].sort(),[...enabled].sort());
 assert.equal(newTopics.length,7);
});
test('R51: independently reconstruct 7 new worked-solution families across variants and three difficulties',()=>{
 let count=0;
 for(const [topic,choices] of Object.entries(options))
  for(const option of [{},...choices])
   for(const difficulty of ['easy','standard','challenge'])
    for(let seed=1;seed<=200;seed++){
     const sheet=makeWorksheet(topic,seed,4,difficulty,option);
     assertWorksheetMath(sheet);
     assertWorksheetSteps(sheet);
     count+=sheet.problems.length;
    }
 assert.ok(count>40000,'Insufficient independently verified traces '+count);
});
test('R51: every new worked-steps family refuses damaged but plausible arithmetic while final answers stay correct',async()=>{
 for(const [topic,choices] of Object.entries(options)){
  const sheet=makeWorksheet(topic,20261105,8,'standard',choices[0]);
  const p=sheet.problems[0];
  const last=p.solutionSteps.at(-1);
  const bad={...sheet,problems:[{...p,solutionSteps:[
   ...p.solutionSteps.slice(0,-1),last.replace(/\d+/,digits=>String(Number(digits)+1))
  ]},...sheet.problems.slice(1)]};
  assert.notEqual(last,bad.problems[0].solutionSteps.at(-1),'Failed to perturb final intermediate step');
  assert.doesNotThrow(()=>assertWorksheetMath(bad),topic+' final answer intact');
  assert.throws(()=>assertWorksheetSteps(bad),/Worked-step audit:/,topic);
  await assert.rejects(createWorksheetPdf(bad,topic,'steps','A4'),/Worked-step audit:/,topic);
  const questionFile=await createWorksheetPdf(bad,topic,'questions','A4');
  assert.ok((await PDFDocument.load(questionFile)).getPageCount()>0);
 }
});
test('R51: no newly authorized steps topic can silently bypass trace checks',()=>{
 const sheet=makeWorksheet('one-step-equations-worksheets',20261105,4);
 const changed={...sheet,topicId:'unsupported-future-topic',
  problems:sheet.problems.map(p=>({...p,topicId:'unsupported-future-topic'}))};
 assert.throws(()=>assertWorksheetSteps(changed),/Worked-step audit:/);
});
test('R51: real teacher-solution PDFs print on both A4 and Letter for all new families',async()=>{
 for(const [topic,choices] of Object.entries(options)){
  const sheet=makeWorksheet(topic,20261105,8,'challenge',choices[0]);
  for(const paper of ['A4','Letter']){
   const bytes=await createWorksheetPdf(sheet,topic,'steps',paper);
   const pdf=await PDFDocument.load(bytes);
   assert.ok(pdf.getPageCount()>0&&pdf.getTitle().includes(sheet.optionsHash));
  }
 }
});
