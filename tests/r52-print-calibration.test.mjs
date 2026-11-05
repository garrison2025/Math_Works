import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {createPrinterCalibrationPdf} from '../src/lib/pdf.ts';
import {checkPrintScale,PRINT_SCALE_TARGET_MM,PRINT_SCALE_TOLERANCE_MM} from '../src/lib/print-calibration.ts';

test('R52 user-reported 100mm X/Y measurements handle exact tolerance boundaries',()=>{
 assert.equal(PRINT_SCALE_TARGET_MM,100);
 assert.equal(PRINT_SCALE_TOLERANCE_MM,1);
 for(const [h,v] of [['100','100'],['99','101'],['101','99'],['99.01','100.99']]){
  const r=checkPrintScale(h,v);
  assert.equal(r.status,'within-tolerance',JSON.stringify([h,v]));
  assert.match(r.message,/user-reported/i);
 }
 for(const [h,v] of [['98.99','100'],['100','101.01'],['115','100'],['100','95']])
  assert.equal(checkPrintScale(h,v).status,'adjust',JSON.stringify([h,v]));
 for(const [h,v] of [['','100'],['100',''],['NaN','100'],['1e2','100'],['0','100'],['-2','100'],['100,0','100'],['201','100']])
  assert.equal(checkPrintScale(h,v).status,'invalid',JSON.stringify([h,v]));
});

test('R52 A4 and Letter calibration PDFs include one actual-size printable page',async()=>{
 for(const [paper,width,height] of [['A4',595.28,841.89],['Letter',612,792]]){
  const bytes=await createPrinterCalibrationPdf(paper);
  assert.ok(bytes.length>1000);
  const pdf=await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(),1);
  assert.ok(Math.abs(pdf.getPage(0).getWidth()-width)<.03);
  assert.ok(Math.abs(pdf.getPage(0).getHeight()-height)<.03);
  assert.match(pdf.getTitle()??'',/printer calibration - 100 mm/);
  assert.match(pdf.getSubject()??'',/do not prove printer accuracy/i);
 }
});
