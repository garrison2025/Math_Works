import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {trapezoidLayout} from '../src/lib/graph.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {makeWorksheet,sampleProblem} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';

test('R44 trapezoid drawings respect which parallel base is wider',()=>{
 for(const [bottom,top] of [[3,16],[16,3],[3,3],[2,50],[50,2],[5,11],[11,5]]){
  const d={kind:'trapezoid',values:[bottom,top]};
  const g=trapezoidLayout(d);
  assert.ok(g.bottomLeft>0&&g.bottomRight<1&&g.topLeft>0&&g.topRight<1);
  assert.ok(g.altitudeX>=g.topLeft&&g.altitudeX<=g.topRight);
  assert.ok(g.altitudeX>=g.bottomLeft&&g.altitudeX<=g.bottomRight);
  assert.equal(Math.sign(g.bottomWidth-g.topWidth),Math.sign(bottom-top));
  const svg=diagramSVG(d);
  assert.match(svg,/Schematic - not to scale/);
  assert.match(svg,/<polygon points="/);
  assert.ok(svg.includes('>'+bottom+'</text>')&&svg.includes('>'+top+'</text>'));
 }
 for(const values of [[0,5],[3,-1],[NaN,6],[5],[3,4,0]])
  assert.throws(()=>trapezoidLayout({kind:'trapezoid',values}));
});
test('R44 no changes to existing trapezoid questions and expected area',()=>{
 for(let seed=0;seed<500;seed++)for(const task of ['area','missing-height']){
  const p=sampleProblem('area-of-trapezoids-worksheets',seed,'standard',{task});
  const values=p.diagramSpec.values;
  assert.equal(p.diagramSpec.kind,'trapezoid');
  assert.ok(values.length===2||values.length===3);
  assert.ok(trapezoidLayout(p.diagramSpec).bottomWidth>0);
 }
});
test('R44 long division has intermediate writing guides, still masks answers',()=>{
 for(const seed of [7,42,20261105]){
  const p=sampleProblem('long-division-worksheets',seed,'standard',{divisorDigits:'two',dividendDigits:'four',remainder:'yes'});
  const svg=diagramSVG(p.diagramSpec);
  assert.match(svg,/class="division-work-guides"/);
  assert.equal((svg.match(/M178 \\d+H360/g)||[]).length,5,'Four-digit division must leave 5 rows for successive subtraction');
  assert.match(svg,/quotient: ______/);
  assert.match(svg,/remainder: ______/);
  assert.ok(!svg.includes(p.expectedAnswer),'Solution leaked in diagram');
 }
});
test('R44 full-size long-division and trapezoid PDFs pass on both paper types',async()=>{
 for(const topic of ['long-division-worksheets','area-of-trapezoids-worksheets']){
  const sheet=makeWorksheet(topic,20261105,20,'challenge');
  for(const paper of ['A4','Letter']){
   const bytes=await createWorksheetPdf(sheet,topic,'questions',paper);
   const doc=await PDFDocument.load(bytes);
   assert.ok(doc.getPageCount()>0);
   assert.ok(doc.getTitle()?.includes(sheet.optionsHash));
  }
 }
});
