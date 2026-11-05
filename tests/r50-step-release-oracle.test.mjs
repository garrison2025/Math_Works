import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {verifiedStepTopics} from '../src/lib/capabilities.ts';
import {assertWorksheetMath} from '../src/lib/math-release-oracle.ts';
import {assertWorksheetSteps,INDEPENDENT_STEP_TOPICS} from '../src/lib/step-release-oracle.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';

const cases={
 'two-digit-multiplication-worksheets':[{factorRange:'small'},{factorRange:'large'}],
 'three-digit-by-two-digit-multiplication-worksheets':[{multiplierRange:'low'},{multiplierRange:'high'}],
 'two-step-equations-worksheets':[{coefficient:'positive'},{coefficient:'negative'}],
 'fractions-worksheets':[
  {operation:'addition'},{operation:'subtraction'},
  {operation:'multiplication'},{operation:'division'},
  {operation:'addition',denominators:'unlike'}],
 'adding-unlike-fractions-worksheets':[{sumType:'proper'},{sumType:'improper'}],
 'multiplying-fractions-worksheets':[{result:'proper'},{result:'improper'}],
 'long-division-worksheets':[
  {remainder:'no',divisorDigits:'one',dividendDigits:'three'},
  {remainder:'yes',divisorDigits:'two',dividendDigits:'four'}],
 'mean-absolute-deviation-worksheets':[
  {distribution:'symmetric',size:'5'},
  {distribution:'symmetric',size:'6'},
  {distribution:'skewed',size:'8'}]
};
test('R50: eight independent worked-step families remain a strict subset of the 15 authorized step topics',()=>{
 const available=verifiedStepTopics();
 assert.equal(available.length,15);
 assert.equal(INDEPENDENT_STEP_TOPICS.length,15);
 for(const topic of INDEPENDENT_STEP_TOPICS)
  assert.ok(available.includes(topic),topic+' no longer offers verified steps');
 for(const topic of Object.keys(cases))assert.ok(INDEPENDENT_STEP_TOPICS.includes(topic),topic);
});
test('R50: full worked arithmetic is independently reconstructed across difficulties and task options',()=>{
 let total=0;
 for(const [topic,choices] of Object.entries(cases))
  for(const options of [{},...choices])
   for(const difficulty of ['easy','standard','challenge'])
    for(let seed=1;seed<=100;seed++){
     const sheet=makeWorksheet(topic,seed,4,difficulty,options);
     assertWorksheetMath(sheet);
     assertWorksheetSteps(sheet);
     total+=sheet.problems.length;
    }
 assert.ok(total>=30000,'Insufficient independent step traces '+total);
});
test('R50: colluding answer fields remain correct while corrupted teaching arithmetic is blocked from real PDF steps',async()=>{
 for(const [topic,choices] of Object.entries(cases)){
  const sheet=makeWorksheet(topic,20261105,8,'standard',choices[0]);
  const first=sheet.problems[0];
  const broken={...sheet,problems:[
   {...first,solutionSteps:[...first.solutionSteps.slice(0,-1),'Wrong arithmetic: 7 × 9 = 10']},
   ...sheet.problems.slice(1)]};
  assert.doesNotThrow(()=>assertWorksheetMath(broken),'Answer math must still be valid for '+topic);
  assert.throws(()=>assertWorksheetSteps(broken),/Worked-step audit:/,topic);
  await assert.rejects(createWorksheetPdf(broken,topic,'steps','A4'),/Worked-step audit:/,topic);
 }
});
test('R50: all 15 step-enabled topics reject unsafe or missing step prose',async()=>{
 for(const topic of verifiedStepTopics()){
  const sheet=makeWorksheet(topic,20261105,4,'standard');
  const first=sheet.problems[0];
  const broken={...sheet,problems:[
   {...first,solutionSteps:['undefined = NaN']},...sheet.problems.slice(1)]};
  assert.throws(()=>assertWorksheetSteps(broken),/Worked-step audit:/,topic);
  await assert.rejects(createWorksheetPdf(broken,topic,'steps','Letter'),/Worked-step audit:/,topic);
 }
});
test('R50: real A4 and Letter worked steps pass for every independently audited family',async()=>{
 for(const [topic,choices] of Object.entries(cases)){
  const sheet=makeWorksheet(topic,20261105,8,'challenge',choices[0]);
  for(const paper of ['A4','Letter']){
   const pdf=await createWorksheetPdf(sheet,topic,'steps',paper);
   const doc=await PDFDocument.load(pdf);
   assert.ok(doc.getPageCount()>0&&doc.getTitle().includes(sheet.optionsHash));
  }
 }
});
test('R50: a structurally valid but mathematically false line does not block question-only PDF',async()=>{
 const topic='two-digit-multiplication-worksheets';
 const sheet=makeWorksheet(topic,20261105,3);
 const first=sheet.problems[0];
 const altered={...sheet,problems:[
  {...first,solutionSteps:['Partial products: 9 + 8 = 3']},
  ...sheet.problems.slice(1)]};
 assert.throws(()=>assertWorksheetSteps(altered),/Worked-step audit:/);
 const file=await createWorksheetPdf(altered,topic,'questions','A4');
 const doc=await PDFDocument.load(file);
 assert.ok(doc.getPageCount()>=1);
});
