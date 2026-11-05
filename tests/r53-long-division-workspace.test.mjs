import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet,sampleProblem,GENERATOR_VERSION} from '../src/lib/math.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
import {longDivisionPracticeRows,longDivisionDiagramHeight} from '../src/lib/long-division-layout.ts';
import {assertWorksheetMath} from '../src/lib/math-release-oracle.ts';
const topic='long-division-worksheets';
test('R53 pencil guides: three-digit dividend has 4 rows, four-digit has 5',()=>{
 for(const [dividend,rows] of [[123,4],[999,4],[1000,5],[9876,5]]){
  assert.equal(longDivisionPracticeRows([dividend,12]),rows);
  assert.equal(longDivisionDiagramHeight([dividend,12]),rows*18+115);
 }
 for(const bad of [[12,5],[10000,7],[1000,0],[1000,1000],[120.5,4],[]])
  assert.throws(()=>longDivisionPracticeRows(bad),/long-division|Long-division/);
});
test('R53 SVG preserves blank quotient and remainder and makes row count digit-aware',()=>{
 assert.equal(GENERATOR_VERSION,'18');
 for(const dividendDigits of ['three','four']){
  for(const divisorDigits of ['one','two']){
   for(const seed of [1,17,74,20261105,20261106]){
    const p=sampleProblem(topic,seed,'challenge',
     {divisorDigits,dividendDigits,remainder:'yes'});
    const svg=diagramSVG(p.diagramSpec);
    assert.match(svg,/long-division-vector/);
    assert.match(svg,/viewBox="0 0 450 270"/);
    const path=svg.match(/class="division-work-guides" d="([^"]+)"/);
    assert.ok(path,'R53 SVG writing guide path missing');
    assert.equal([...path[1].matchAll(/M178 \d+H360/g)].length,
     dividendDigits==='three'?4:5);
    assert.ok(svg.includes('quotient: ______')&&svg.includes('remainder: ______'));
    assert.equal(String(p.diagramSpec.values[0]).length,dividendDigits==='three'?3:4);
    assert.ok(!svg.includes(p.expectedAnswer),'Practice figure leaked quotient/remainder');
   }
  }
 }
});
test('R53 A4 and Letter full long-division worksheets paginate with no blank pages',async()=>{
 for(const dividendDigits of ['three','four'])for(const paper of ['Letter','A4']){
  const sheet=makeWorksheet(topic,20261105,40,'challenge',
   {divisorDigits:'two',dividendDigits,remainder:'yes'});
  assertWorksheetMath(sheet);
  const pdf=await PDFDocument.load(await createWorksheetPdf(sheet,topic,'questions',paper));
  assert.ok(pdf.getPageCount()>=8&&pdf.getPageCount()<=40);
  assert.ok(Math.abs(pdf.getPage(0).getWidth()-(paper==='A4'?595.28:612))<.1);
  assert.match(pdf.getTitle(),/generator v18/);
  assert.equal(sheet.problems.length,40);
  assert.equal(sheet.answerMap.length,40);
 }
});
