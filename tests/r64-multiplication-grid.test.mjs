import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {createMultiplicationGridPdf,multiplicationGridValue,MULTIPLICATION_GRID_LIMIT} from '../src/lib/multiplication-grid.ts';

test('R64 independent arithmetic oracle: exact 1-12 product table and strict bounds',()=>{
 assert.equal(MULTIPLICATION_GRID_LIMIT,12);
 const seen=new Set();
 for(let row=1;row<=12;row++)for(let col=1;col<=12;col++){
  assert.equal(multiplicationGridValue(row,col),row*col);
  assert.equal(multiplicationGridValue(col,row),row*col,'Multiplication table must be symmetric');
  seen.add(row+'|'+col);
 }
 assert.equal(seen.size,144);
 for(const [row,col] of [[0,1],[13,1],[1,0],[1,13],[-1,7],[2,1.5],[NaN,1],[Infinity,1],['5',2]])
  assert.throws(()=>multiplicationGridValue(row,col),/Table indices/);
});
test('R64 both papers export separate blank/teacher reference charts, one vector page each',async()=>{
 for(const paper of ['Letter','A4'])for(const mode of ['blank','key']){
  const bytes=await createMultiplicationGridPdf(paper,mode);
  assert.ok(bytes.byteLength>900,paper+mode+' unexpectedly empty PDF');
  const pdf=await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(),1,'Chart must fit on one sheet');
  const page=pdf.getPage(0);
  assert.ok(Math.abs(page.getWidth()-(paper==='Letter'?612:595.28))<.1);
  assert.ok(Math.abs(page.getHeight()-(paper==='Letter'?792:841.89))<.1);
  assert.match(pdf.getTitle()??'',/Multiplication Table 1-12/);
  assert.match(pdf.getTitle()??'',mode==='blank'?/Blank Worksheet/:/Answer Key/);
  assert.match(pdf.getSubject()??'',/not the randomized facts generator/);
 }
});
test('R64 bad document settings cannot silently generate a misleading chart',async()=>{
 await assert.rejects(()=>createMultiplicationGridPdf('Legal','blank'),/Unsupported paper size/);
 await assert.rejects(()=>createMultiplicationGridPdf('A4','draft'),/Invalid multiplication grid mode/);
});
