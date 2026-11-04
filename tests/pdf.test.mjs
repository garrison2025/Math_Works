import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf,createBlankProtractorPdf,ascii} from '../src/lib/pdf.ts';
import {hasVerifiedSteps} from '../src/lib/capabilities.ts';
const mathTopics=[
 'two-step-equations-worksheets','adding-unlike-fractions-worksheets',
 'two-digit-multiplication-worksheets','pythagorean-worksheets',
 'box-plots-worksheets','printable-protractor',
 'triangle-angle-sum-worksheets','volume-of-rectangular-prisms-worksheets',
 'inequalities-worksheets','scatter-plot-worksheets','linear-equations-worksheets'
];
const sizes={Letter:[612,792],A4:[595.28,841.89]};
for(const topic of mathTopics)test(`PDF roundtrip: ${topic}`,async()=>{
 for(const paper of ['Letter','A4'])for(const mode of ['questions','answers','steps']){
  if(mode==='steps'&&!hasVerifiedSteps(topic))continue;
  const sheet=makeWorksheet(topic,20261104,8,'standard');
  const bytes=await createWorksheetPdf(sheet,topic,mode,paper);
  assert.ok(bytes.byteLength>1000,`empty output ${topic} ${mode} ${paper}`);
  const doc=await PDFDocument.load(bytes);
  assert.ok(doc.getPageCount()>=1);
  const [width,height]=sizes[paper];
  for(const page of doc.getPages()){
   assert.ok(Math.abs(page.getWidth()-width)<.015);
   assert.ok(Math.abs(page.getHeight()-height)<.015);
  }
  assert.ok(doc.getTitle()?.includes(sheet.seed.toString()));
 }
});
test('PDF steps reject unreviewed topics rather than imply verified solution',async()=>{
 const sheet=makeWorksheet('box-plots-worksheets',7,8);
 await assert.rejects(()=>createWorksheetPdf(sheet,'Box Plots','steps','Letter'),/not yet verified/);
});
test('multipage output has no zero-page or lost-page failures',async()=>{
 for(const topic of ['two-step-equations-worksheets','box-plots-worksheets']){
  for(const quantity of [1,8,20,40]){
   const sheet=makeWorksheet(topic,20261104,quantity);
   const doc=await PDFDocument.load(await createWorksheetPdf(sheet,topic,'answers','A4'));
   assert.ok(doc.getPageCount()>0);
   if(quantity===40)assert.ok(doc.getPageCount()>1);
  }
 }
});

test('PDF text transliteration preserves function-table arrows',()=>{
 assert.equal(ascii('1→2; -3 ← 4; 5 × 6'), '1 -> 2; -3  <-  4; 5 x 6');
});
test('blank protractor PDF is single page on Letter and A4',async()=>{
 for(const paper of ['Letter','A4']){
  const bytes=await createBlankProtractorPdf(paper);
  assert.ok(bytes.byteLength>2000);
  const doc=await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(),1);
  const [w,h]=sizes[paper];assert.ok(Math.abs(doc.getPage(0).getWidth()-w)<.015);assert.ok(Math.abs(doc.getPage(0).getHeight()-h)<.015);
 }
});

test('protractor exercise sheets reserve enough physical space per page',async()=>{
 for(const paper of ['Letter','A4']){
  const sheet=makeWorksheet('printable-protractor',20261104,4);
  const doc=await PDFDocument.load(await createWorksheetPdf(sheet,'Printable Protractor','questions',paper));
  assert.ok(doc.getPageCount()>=2,`${paper} failed to break full-size protractors across pages`);
 }
});
