import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
import {assertWorksheetMath} from '../src/lib/math-release-oracle.ts';
import {assertWorksheetSteps,INDEPENDENT_STEP_TOPICS} from '../src/lib/step-release-oracle.ts';
import {verifiedStepTopics} from '../src/lib/capabilities.ts';
const added={
 'two-digit-by-one-digit-multiplication-worksheets':[{regrouping:'yes'},{regrouping:'no'}],
 'integer-operations-worksheets':[{operation:'addition'},{operation:'subtraction'},{operation:'multiplication'},{operation:'division'}],
 'addition-worksheets':[{regrouping:'yes'},{regrouping:'no'}],
 'subtraction-worksheets':[{borrowing:'yes'},{borrowing:'no'}],
 'mixed-addition-subtraction-worksheets':[{operation:'addition'},{operation:'subtraction'}],
 'multiplication-worksheets':[{factors:'times-tables'},{factors:'two-digit-by-one-digit'}],
 'multiplication-tables-worksheets':[{table:'1'},{table:'12'}],
 'division-worksheets':[{divisor:'2'},{divisor:'12'}]
};
test('R93: all eight newly enabled arithmetic families are independently audited and old 15 preserved',()=>{
 const enabled=verifiedStepTopics();
 assert.ok(enabled.length>=23,'The 23 R93 step families must remain certified');
 assert.deepEqual([...INDEPENDENT_STEP_TOPICS].sort(),[...enabled].sort());
 assert.equal(Object.keys(added).length,8);
 for(const name of Object.keys(added))assert.ok(enabled.includes(name));
});
test('R93: independently reconstruct 8 families over all difficulties and targeted variants',()=>{
 let reviewed=0;
 for(const [name,variants] of Object.entries(added)){
  for(const settings of [{},...variants]){
   for(const difficulty of ['easy','standard','challenge']){
    for(let seed=1;seed<=125;seed++){
     const sheet=makeWorksheet(name,seed,4,difficulty,settings);
     assertWorksheetMath(sheet);
     assertWorksheetSteps(sheet);
     reviewed+=sheet.problems.length;
    }
   }
  }
 }
 assert.ok(reviewed>=28000);
});
test('R93: falsified arithmetic lines are rejected even when final answer remains valid',async()=>{
 for(const [name,variants] of Object.entries(added)){
  const sheet=makeWorksheet(name,20261107,8,'standard',variants[0]);
  const first=sheet.problems[0],bad={...sheet,problems:[
   {...first,solutionSteps:[...first.solutionSteps.slice(0,-1),'Inverse check: 100 + 1 = 20.']},
   ...sheet.problems.slice(1)
  ]};
  assert.doesNotThrow(()=>assertWorksheetMath(bad),'Answer oracle must be independent of steps');
  assert.throws(()=>assertWorksheetSteps(bad),/Worked-step audit:/);
  await assert.rejects(createWorksheetPdf(bad,name,'steps','A4'),/Worked-step audit:/);
 }
});
test('R93: every new step topic emits real A4 and US Letter teacher-solution PDFs',async()=>{
 for(const [name,variants] of Object.entries(added)){
  const sheet=makeWorksheet(name,20261107,8,'challenge',variants[0]);
  for(const paper of ['A4','Letter']){
   const data=await createWorksheetPdf(sheet,name,'steps',paper);
   const doc=await PDFDocument.load(data);
   assert.ok(doc.getPageCount()>=1);
   assert.ok(doc.getTitle()?.includes(sheet.optionsHash));
  }
 }
});
