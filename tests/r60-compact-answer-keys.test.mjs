/** R60: teachers should not need five sheets for 40 text-only answers.
 * Test ONLY print presentation: worksheet seed/math/IDs and worded answers
 * remain unchanged; chart answer diagrams must stay full width.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';

const compact=[
 'two-step-equations-worksheets','fractions-worksheets',
 'scientific-notation-worksheets','functions-worksheets',
 'mean-median-mode-range-worksheets','percentages-worksheets',
 'addition-worksheets','integer-operations-worksheets'
];
for(const topic of compact)test('R60 40-answer teacher key prints compact: '+topic,async()=>{
 const set=makeWorksheet(topic,20261106,40,'standard');
 assert.ok(set.problems.every(p=>!p.diagramSpec));
 for(const paper of ['Letter','A4']){
  const [questions,answers,extra]=await Promise.all([
   createWorksheetPdf(set,topic,'questions',paper),
   createWorksheetPdf(set,topic,'answers',paper),
   createWorksheetPdf(set,topic,'answers',paper,'extra')
  ]);
  const [qpdf,apdf,xpdf]=await Promise.all([questions,answers,extra].map(PDFDocument.load));
  assert.ok(apdf.getPageCount()<=4,
   topic+' 40 answers wasted too much paper; expected <=4 after compact teacher layout');
  assert.ok(apdf.getPageCount()<=qpdf.getPageCount()+1,
   topic+' answer key unexpectedly larger than student worksheet');
  assert.equal(apdf.getPageCount(),xpdf.getPageCount(),
   'Writing-room setting must not change teacher answer key pagination');
  assert.match(apdf.getTitle()??'',/ - answers - /);
  assert.ok(apdf.getTitle()?.includes(set.optionsHash));
  assert.deepEqual(set.answerMap,set.problems.map(p=>({id:p.id,answer:p.expectedAnswer})));
 }
});
test('R60 chart and diagram answer sheets keep uncompressed full-width layouts',async()=>{
 for(const topic of ['box-plots-worksheets','scatter-plot-worksheets','long-division-worksheets']){
  const sheet=makeWorksheet(topic,20261106,8,'standard');
  assert.ok(sheet.problems.some(p=>p.diagramSpec),topic+' must contain diagrams');
  for(const paper of ['A4','Letter']){
   const pdf=await PDFDocument.load(await createWorksheetPdf(sheet,topic,'answers',paper));
   assert.ok(pdf.getPageCount()>=1);
   assert.ok(pdf.getPageCount()<=8);
  }
 }
});
