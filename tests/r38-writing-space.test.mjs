import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf,worksheetWorkLines} from '../src/lib/pdf.ts';

test('R38 work line allocation is topic-specific, and never leaks to answer/steps PDF',()=>{
 assert.equal(worksheetWorkLines('two-step-equations-worksheets','questions',false),2);
 assert.equal(worksheetWorkLines('one-step-equations-worksheets','questions',false),1);
 assert.equal(worksheetWorkLines('fractions-worksheets','questions',false),2);
 assert.equal(worksheetWorkLines('multiplication-tables-worksheets','questions',false),0);
 assert.equal(worksheetWorkLines('two-step-equations-worksheets','questions',true),0);
 for(const mode of ['answers','steps'])
  assert.equal(worksheetWorkLines('two-step-equations-worksheets',mode,false),0);
});
test('R38 full 40-question equations and fractions still paginate with safe header identity',async()=>{
 for(const topic of ['one-step-equations-worksheets','two-step-equations-worksheets','fractions-worksheets','order-of-operations-worksheets']){
  const set=makeWorksheet(topic,20261105,40,'challenge');
  for(const paper of ['Letter','A4']){
   const raw=await createWorksheetPdf(set,topic,'questions',paper);
   const doc=await PDFDocument.load(raw);
   assert.ok(doc.getPageCount()>=2,topic+' expected multi-page writing layout');
   assert.ok(doc.getPageCount()<=40,topic+' gained blank/overflow pages');
   assert.match(doc.getTitle()??'',/layout 2/);
   assert.ok(doc.getTitle()?.includes(set.optionsHash));
  }
 }
});
