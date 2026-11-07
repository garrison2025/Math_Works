import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
import {assertWorksheetMath} from '../src/lib/math-release-oracle.ts';
import {assertWorksheetSteps,INDEPENDENT_STEP_TOPICS} from '../src/lib/step-release-oracle.ts';
import {hasVerifiedSteps,verifiedStepTopics} from '../src/lib/capabilities.ts';

const R94_GEOMETRY = {
 'complementary-supplementary-angles-worksheets': [
  {relation:'complementary'},{relation:'supplementary'},{relation:'mixed'}
 ],
 'triangle-angle-sum-worksheets': [
  {thirdAngle:'acute'},{thirdAngle:'right'},{thirdAngle:'obtuse'},{thirdAngle:'mixed'}
 ],
 'vertical-angles-worksheets': [
  {task:'vertical'},{task:'adjacent'}
 ],
 'volume-of-rectangular-prisms-worksheets': [
  {task:'volume'},{task:'missing-height'},{task:'mixed'}
 ]
};

test('R94: four geometry step families are gated by independent reconstructed equations',()=>{
 const enabled=verifiedStepTopics();
 assert.ok(enabled.length>=27,'R94 step families must stay independently certified');
 assert.deepEqual([...INDEPENDENT_STEP_TOPICS].sort(),[...enabled].sort());
 for(const slug of Object.keys(R94_GEOMETRY))assert.equal(hasVerifiedSteps(slug),true,slug);
 assert.equal(hasVerifiedSteps('box-plots-worksheets'),false);
 assert.equal(hasVerifiedSteps('scatter-plot-worksheets'),false);
 assert.equal(hasVerifiedSteps('printable-protractor'),false);
});

test('R94: geometry explanations match source question and exact answer on variants/difficulties/seeds',()=>{
 let problems=0;
 for(const [slug,variants] of Object.entries(R94_GEOMETRY)){
  for(const settings of variants){
   for(const difficulty of ['easy','standard','challenge']){
    for(let seed=1;seed<=80;seed++){
     const sheet=makeWorksheet(slug,seed,6,difficulty,settings);
     assertWorksheetMath(sheet);
     assertWorksheetSteps(sheet);
     problems+=sheet.problems.length;
    }
   }
  }
 }
 assert.ok(problems>=16000,'Expected robust samples; got '+problems);
});

test('R94: fabricated geometry explanation cannot pass even with correct answer',async()=>{
 for(const [slug,variants] of Object.entries(R94_GEOMETRY)){
  for(const settings of variants){
   const sheet=makeWorksheet(slug,20261107,4,'standard',settings);
   const altered={...sheet,problems:sheet.problems.map((p,i)=>i===0?
    {...p,solutionSteps:[...p.solutionSteps.slice(0,-1),'Answer: 999 units']} : p)};
   assert.doesNotThrow(()=>assertWorksheetMath(altered),'Answer oracle is independent from steps');
   assert.throws(()=>assertWorksheetSteps(altered),/Worked-step audit:/,slug);
   await assert.rejects(createWorksheetPdf(altered,slug,'steps','A4'),/Worked-step audit:/);
  }
 }
});

test('R94: A4/Letter steps PDF exports carry exact worksheet fingerprint',async()=>{
 for(const [slug,variants] of Object.entries(R94_GEOMETRY)){
  for(const settings of variants.slice(0,2)){
   const sheet=makeWorksheet(slug,20261107,8,'challenge',settings);
   for(const paper of ['A4','Letter']){
    const output=await createWorksheetPdf(sheet,slug,'steps',paper);
    const pdf=await PDFDocument.load(output);
    assert.ok(pdf.getPageCount()>0,slug);
    assert.ok(pdf.getTitle()?.includes(sheet.optionsHash),slug);
   }
  }
 }
});
