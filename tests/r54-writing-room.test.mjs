import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf,worksheetWorkLines} from '../src/lib/pdf.ts';
import {extraWritingRules} from '../src/lib/writing-room.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
import {assertWorksheetMath} from '../src/lib/math-release-oracle.ts';

test('R54 opt-in pencil rules do not modify defaults or calibrated specialist diagrams',()=>{
 assert.equal(worksheetWorkLines('two-step-equations-worksheets','questions',false),2);
 for(const slug of ['addition-worksheets','two-step-equations-worksheets','scientific-notation-worksheets']){
  assert.equal(extraWritingRules(slug,'questions',undefined,'extra'),2);
  assert.equal(extraWritingRules(slug,'questions',undefined,'standard'),0);
 }
 assert.equal(extraWritingRules('area-of-triangles-worksheets','questions','triangle','extra'),1);
 assert.equal(extraWritingRules('box-plots-worksheets','questions','box-practice','extra'),1);
 assert.equal(extraWritingRules('printable-protractor','questions','protractor','extra'),0);
 assert.equal(extraWritingRules('long-division-worksheets','questions','long-division','extra'),0);
 for(const mode of ['answers','steps']){
  assert.equal(extraWritingRules('two-step-equations-worksheets',mode,undefined,'extra'),0);
  assert.equal(extraWritingRules('area-of-triangles-worksheets',mode,'triangle','extra'),0);
 }
 assert.throws(()=>extraWritingRules('addition-worksheets','questions',undefined,'weird'),/Invalid PDF writing space/);
});

test('R54 extra pencil room survives a reproducible link; old share links remain unchanged',()=>{
 const topic='two-step-equations-worksheets';
 const base={seed:20261106,quantity:8,difficulty:'challenge',paper:'A4',options:{coefficient:'negative'}};
 const old=buildWorksheetLink('https://math-works.pages.dev/'+topic+'/',topic,base);
 assert.ok(!old.includes('room='));
 assert.deepEqual(parseWorksheetLink(old,topic),base);
 const withRoom=buildWorksheetLink('https://math-works.pages.dev/'+topic+'/',topic,{...base,writingRoom:'extra'});
 assert.equal(new URL(withRoom).searchParams.get('room'),'extra');
 assert.deepEqual(parseWorksheetLink(withRoom,topic),{...base,writingRoom:'extra'});
 assert.deepEqual(makeWorksheet(topic,base.seed,base.quantity,base.difficulty,base.options),
  makeWorksheet(topic,parseWorksheetLink(withRoom,topic).seed,base.quantity,base.difficulty,base.options));
 assert.equal(parseWorksheetLink(old+'&room=nonsense',topic).writingRoom,undefined);
 assert.throws(()=>buildWorksheetLink(old,topic,{...base,writingRoom:'oversized'}),/Invalid worksheet link settings/);
});

test('R54 additional writing rows paginate actual A4 and Letter PDFs without modifying answers',async()=>{
 const cases=['addition-worksheets','two-step-equations-worksheets','area-of-triangles-worksheets','long-division-worksheets','printable-protractor'];
 for(const slug of cases)for(const paper of ['A4','Letter']){
  const sheet=makeWorksheet(slug,20261106,20,'challenge');
  assertWorksheetMath(sheet);
  const [baseline,extra,answer]=await Promise.all([
   createWorksheetPdf(sheet,slug,'questions',paper),
   createWorksheetPdf(sheet,slug,'questions',paper,'extra'),
   createWorksheetPdf(sheet,slug,'answers',paper,'extra')
  ]);
  const [standardPdf,extraPdf,answerPdf]=await Promise.all(
   [baseline,extra,answer].map(bytes=>PDFDocument.load(bytes)));
  const count=extraPdf.getPageCount();
  assert.ok(count>=standardPdf.getPageCount(),'Extra writing rows should never reduce page count: '+slug);
  assert.ok(count<=sheet.problems.length,'No excess blank pages: '+slug);
  assert.ok(Math.abs(extraPdf.getPage(0).getWidth()-(paper==='A4'?595.28:612))<0.1);
  assert.match(extraPdf.getTitle()??'',/extra writing room/);
  assert.ok(!standardPdf.getTitle()?.includes('extra writing room'),'Default changed');
  assert.ok(!answerPdf.getTitle()?.includes('extra writing room'),'Answer page should not gain extra space');
  assert.ok(answerPdf.getPageCount()>0);
 }
});
