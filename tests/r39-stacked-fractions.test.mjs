import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {fractionLayoutFor,fractionMarkup} from '../src/lib/fraction-layout.ts';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
test('R39 conservative fraction parser and safe source-preserving HTML',()=>{
 for(const [topic,q,count] of [
 ['fractions-worksheets','1/2 + 3/4 = ____',2],
 ['fractions-worksheets','4/7 − 2/7 = ____',2],
 ['fractions-worksheets','5/8 × 11/12 = ____',2],
 ['fractions-worksheets','5/8 ÷ 11/12 = ____',2],
 ['equivalent-fractions-worksheets','2/3 = ____/12',2],
 ['equivalent-fractions-worksheets','2/3 = 8/____',2],
 ['adding-unlike-fractions-worksheets','1/3 + 2/5 = ____',2],
 ['multiplying-fractions-worksheets','2/3 × 4/5 = ____',2],
 ['percentages-worksheets','Convert 3/8 into a percentage.',1]
 ]){
  const layout=fractionLayoutFor(topic,q);
  assert.ok(layout,topic+': '+q);
  assert.equal(layout.tokens.filter(t=>t.kind==='fraction').length,count);
  const html=fractionMarkup(layout);
  assert.equal((html.match(/class="stacked-frac"/g)||[]).length,count);
  assert.match(html,/aria-hidden="true"/);
  assert.doesNotMatch(html,/script|onclick|<img/);
 }
 for(const [topic,q] of [
 ['fractions-worksheets','1/0 + 1/2 = ____'],
 ['fractions-worksheets','1/2 + 3/4 = __x__'],
 ['fractions-worksheets','Solve: 1/2 + 3/4'],
 ['adding-unlike-fractions-worksheets','1/2 = ____/6'],
 ['percentages-worksheets','Convert 3/8 into a fraction.'],
 ['one-step-equations-worksheets','1/2 + 3/4 = ____']
 ])assert.equal(fractionLayoutFor(topic,q),null);
});
test('R39 authentic fixed-choice fraction generators export both papers with pagination',async()=>{
 const cases=[
 ['fractions-worksheets',{operation:'division',denominators:'unlike'}],
 ['equivalent-fractions-worksheets',{missing:'numerator'}],
 ['adding-unlike-fractions-worksheets',{sumType:'mixed'}],
 ['multiplying-fractions-worksheets',{result:'mixed'}],
 ['percentages-worksheets',{direction:'fraction-to-percent'}]
 ];
 for(const [topic,options] of cases){
  const sheet=makeWorksheet(topic,20261105,40,'challenge',options);
  assert.equal(sheet.problems.length,40);
  for(const p of sheet.problems)assert.ok(fractionLayoutFor(topic,p.payload.question),p.payload.question);
  for(const paper of ['A4','Letter']){
   const doc=await PDFDocument.load(await createWorksheetPdf(sheet,topic,'questions',paper));
   assert.ok(doc.getPageCount()>0&&doc.getPageCount()<=40);
   assert.ok(doc.getTitle()?.includes(sheet.optionsHash));
  }
 }
});
