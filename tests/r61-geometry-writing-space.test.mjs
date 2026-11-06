/** R61: default calculation space for geometry, preserving specialty diagrams.
 * Evidence is generated from A4/Letter PDFs in a separate independent vector
 * audit; these JS tests gate both arithmetic worklines and normal pagination.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf,worksheetWorkLines} from '../src/lib/pdf.ts';
import {extraWritingRules} from '../src/lib/writing-room.ts';
import {assertWorksheetMath} from '../src/lib/math-release-oracle.ts';

const calculations=[
 ['area-worksheets','rectangle',1],
 ['area-of-triangles-worksheets','triangle',2],
 ['area-of-parallelograms-worksheets','parallelogram',2],
 ['area-of-trapezoids-worksheets','trapezoid',2],
 ['volume-of-rectangular-prisms-worksheets','prism',2],
 ['surface-area-worksheets','prism',2],
 ['pythagorean-worksheets','right-triangle',2],
 ['triangle-angle-sum-worksheets','triangle-angles',1],
 ['complementary-supplementary-angles-worksheets','angle',1],
 ['vertical-angles-worksheets','intersecting-lines',1]
];
test('R61 one or two geometry calculations lines default; no answer/steps leak',()=>{
 for(const [topic,kind,lines] of calculations){
  assert.equal(worksheetWorkLines(topic,'questions',true,kind),lines,topic);
  assert.equal(worksheetWorkLines(topic,'answers',true,kind),0,topic);
  assert.equal(worksheetWorkLines(topic,'steps',true,kind),0,topic);
  assert.equal(extraWritingRules(topic,'questions',kind,'extra'),1);
 }
 for(const kind of ['protractor','long-division','column-multiplication','scatter','coordinate','linear-function','box-practice','dots','function-table']){
  assert.equal(worksheetWorkLines('area-of-triangles-worksheets','questions',true,kind),0,kind);
 }
 for(const [topic,kind] of [
  ['angle-worksheets','angle'],['printable-protractor','protractor'],
  ['long-division-worksheets','long-division'],['scatter-plot-worksheets','scatter'],
  ['box-plots-worksheets','box-practice']
 ])assert.equal(worksheetWorkLines(topic,'questions',true,kind),0,topic);
 assert.equal(worksheetWorkLines('fractions-worksheets','questions',false),2);
 assert.equal(worksheetWorkLines('two-step-equations-worksheets','questions',false),2);
 assert.equal(worksheetWorkLines('two-step-equations-worksheets','questions',true),0);
});
test('R61 long-division ruled algorithm and standard fraction calculation lines remain unchanged',()=>{
 assert.equal(extraWritingRules('long-division-worksheets','questions','long-division','extra'),0);
 assert.equal(extraWritingRules('printable-protractor','questions','protractor','extra'),0);
 assert.equal(extraWritingRules('fractions-worksheets','questions',undefined,'extra'),2);
 assert.equal(extraWritingRules('area-of-trapezoids-worksheets','questions','trapezoid','extra'),1);
});
test('R61 all calculation diagrams paginate 20 questions on Letter/A4 with standard and extra room',async()=>{
 for(const [topic,kind,lines] of calculations){
  const sheet=makeWorksheet(topic,20261106,20,'standard');
  assertWorksheetMath(sheet);
  assert.ok(sheet.problems.every(p=>p.diagramSpec?.kind===kind),
   topic+' changed its geometry diagram unexpectedly');
  for(const paper of ['Letter','A4']){
   const [standard,extra,answers]=await Promise.all([
    createWorksheetPdf(sheet,topic,'questions',paper),
    createWorksheetPdf(sheet,topic,'questions',paper,'extra'),
    createWorksheetPdf(sheet,topic,'answers',paper,'extra')
   ]);
   const [a,b,c]=await Promise.all([standard,extra,answers].map(PDFDocument.load));
   assert.ok(a.getPageCount()>=1&&a.getPageCount()<=20,topic+' standard page count invalid');
   assert.ok(b.getPageCount()>=a.getPageCount()&&b.getPageCount()<=20,
    topic+' extra work area broke pagination');
   assert.ok(c.getPageCount()>=1&&c.getPageCount()<=20,topic+' answer layout failed');
   assert.ok(!c.getTitle()?.includes('extra writing room'),'Teacher answer must not grow pencil space');
   for(const pdf of [a,b,c]){
    assert.ok(pdf.getTitle()?.includes(sheet.optionsHash));
    assert.ok(pdf.getTitle()?.includes('layout 2'));
   }
   assert.deepEqual(sheet.answerMap,sheet.problems.map(({id,expectedAnswer})=>({id,answer:expectedAnswer})));
  }
 }
});
