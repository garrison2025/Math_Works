import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet,sampleProblem} from '../src/lib/math.ts';
import {assertWorksheetIntegrity} from '../src/lib/sheet-integrity.ts';
import {assertWorksheetMath,VERIFIED_AT_PDF_BOUNDARY} from '../src/lib/math-release-oracle.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';

const coverage=[
 'two-step-equations-worksheets','inequalities-worksheets','long-division-worksheets',
 'fractions-worksheets','adding-unlike-fractions-worksheets','multiplying-fractions-worksheets',
 'area-of-trapezoids-worksheets','pythagorean-worksheets','mean-median-mode-range-worksheets',
 'percentages-worksheets'
];
const settings={
 'two-step-equations-worksheets':[{coefficient:'positive'},{coefficient:'negative'}],
 'inequalities-worksheets':[{coefficient:'positive'},{coefficient:'negative'}],
 'long-division-worksheets':[{remainder:'yes',divisorDigits:'two',dividendDigits:'four'},{remainder:'no',divisorDigits:'one',dividendDigits:'three'}],
 'fractions-worksheets':[{operation:'addition'},{operation:'subtraction'},{operation:'division'},{operation:'multiplication'}],
 'adding-unlike-fractions-worksheets':[{sumType:'proper'},{sumType:'improper'}],
 'multiplying-fractions-worksheets':[{result:'proper'},{result:'improper'}],
 'area-of-trapezoids-worksheets':[{task:'area',baseRelation:'inclusive'},{task:'missing-height',baseRelation:'unequal'}],
 'pythagorean-worksheets':[{task:'hypotenuse'},{task:'missing-leg'}],
 'mean-median-mode-range-worksheets':[{statistic:'mean'},{statistic:'median'},{statistic:'mode',modePattern:'two'},{statistic:'mode',modePattern:'none'},{statistic:'range'}],
 'percentages-worksheets':[{direction:'fraction-to-percent'},{direction:'percent-to-fraction'},{direction:'percent-of-number'},{direction:'percent-change'}]
};
test('R46 explicitly scopes 10 answer families and recomputes thousands of seeded questions',()=>{
 assert.deepEqual([...VERIFIED_AT_PDF_BOUNDARY].sort(),coverage.sort());
 let checked=0;
 for(const topic of coverage)for(const options of [{},...settings[topic]])for(let seed=1;seed<=270;seed++){
  const p=sampleProblem(topic,seed,seed%3===0?'challenge':seed%3===1?'easy':'standard',options);
  const sheet=makeWorksheet(topic,seed,4,'standard',options);
  assertWorksheetMath(sheet);
  assert.ok(p.expectedAnswer);
  checked+=sheet.problems.length;
 }
 assert.ok(checked>30000);
});
test('R46 independently refuses a corrupted answer+answerMap pair at the PDF export boundary',async()=>{
 for(const topic of coverage){
  const sheet=makeWorksheet(topic,20261105,8,'standard',settings[topic][0]);
  // Both fields are identically tampered, so prior structural checks cannot detect it.
  const wrong={...sheet,problems:sheet.problems.map((p,i)=>i===0?{...p,expectedAnswer:'999999'}:p),
   answerMap:sheet.answerMap.map((a,i)=>i===0?{...a,answer:'999999'}:a)};
  assert.doesNotThrow(()=>assertWorksheetIntegrity(wrong),`Baseline structural oracle unexpectedly caught ${topic}`);
  assert.throws(()=>assertWorksheetMath(wrong),/Math oracle: incorrect/,`Incorrect answers escaped ${topic}`);
  await assert.rejects(createWorksheetPdf(wrong,'Tampered answers','questions','A4'),/Math oracle: incorrect/);
 }
});
test('R46 independently rejects damaged math question or mismatched geometrical diagram',async()=>{
 const scenarios=[
  ['long-division-worksheets',p=>({...p,diagramSpec:{...p.diagramSpec,values:[999,3]}})],
  ['inequalities-worksheets',p=>({...p,diagramSpec:{...p.diagramSpec,labels:['<']}})],
  ['area-of-trapezoids-worksheets',p=>({...p,diagramSpec:{...p.diagramSpec,values:[1,100,1]}})],
  ['pythagorean-worksheets',p=>({...p,diagramSpec:{...p.diagramSpec,values:[1,1]}})]
 ];
 for(const [topic,mutate] of scenarios){
  const sheet=makeWorksheet(topic,20261105,8);
  const tampered={...sheet,problems:[mutate(sheet.problems[0]),...sheet.problems.slice(1)]};
  assert.throws(()=>assertWorksheetMath(tampered),/Math oracle:/,`Diagram corruption escaped ${topic}`);
 }
 const seed=makeWorksheet('two-step-equations-worksheets',20261105,8);
 const broken={...seed,problems:[{...seed.problems[0],payload:{question:'Solve: 0x + 1 = 2'}},...seed.problems.slice(1)]};
 assert.throws(()=>assertWorksheetMath(broken),/Math oracle:/);
});
test('R46 normal authenticated math sheets export readable A4/Letter question, answers and steps',async()=>{
 for(const topic of coverage){
  const sheet=makeWorksheet(topic,20261105,8,'standard',settings[topic][0]);
  for(const paper of ['Letter','A4'])for(const mode of ['questions','answers']){
   const bytes=await createWorksheetPdf(sheet,topic,mode,paper);
   const pdf=await PDFDocument.load(bytes);
   assert.ok(pdf.getPageCount()>0);
  }
 }
});
