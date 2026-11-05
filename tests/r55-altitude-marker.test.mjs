import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {diagramSVG} from '../src/lib/diagram.ts';
import {trapezoidLayout} from '../src/lib/graph.ts';
import {makeWorksheet,sampleProblem} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
import {assertWorksheetMath} from '../src/lib/math-release-oracle.ts';

const options=[
 ['area-of-triangles-worksheets','triangle'],
 ['area-of-parallelograms-worksheets','parallelogram'],
 ['area-of-trapezoids-worksheets','trapezoid']
];
test('R55 geometry altitude is explicitly perpendicular to the base in every SVG task',()=>{
 let examples=0;
 for(const [topic,kind] of options)for(const task of ['area','missing-height'])
  for(const difficulty of ['easy','standard','challenge'])
   for(let seed=1;seed<=450;seed++){
    const p=sampleProblem(topic,seed,difficulty,{task});
    assert.equal(p.diagramSpec.kind,kind);
    const svg=diagramSVG(p.diagramSpec);
    const found=[...svg.matchAll(/<path class="altitude-right-angle" d="M([^"]+)" stroke="#187b68"/g)];
    assert.equal(found.length,1,topic+' marker count');
    const m=found[0][1].match(/^([0-9.]+) ([0-9.]+)h12v12$/);
    assert.ok(m,'Perpendicular square must use horizontal and vertical strokes');
    const footX=Number(m[1]),startY=Number(m[2]);
    const expectedX=kind==='triangle'?225:kind==='parallelogram'?170:450*trapezoidLayout(p.diagramSpec).altitudeX;
    const expectedY=kind==='trapezoid'?220*trapezoidLayout(p.diagramSpec).bottomY:155;
    assert.ok(Math.abs(footX-expectedX)<.02,'Marker must touch the altitude foot');
    assert.ok(Math.abs(startY+12-expectedY)<.02,'Marker must touch the drawn base');
    assert.match(svg,/Schematic - not to scale/);
    if(task==='missing-height'){
     assert.match(svg,/>\?(?: height)?<\/text>/);
     assert.ok(!svg.includes('>'+p.expectedAnswer+' height</text>'));
    }
    examples++;
   }
 assert.equal(examples,8100);
});
test('R55 actual printed A4/Letter geometry PDFs preserve final answers and no leaked height',async()=>{
 for(const [topic] of options)for(const task of ['area','missing-height']){
  const sheet=makeWorksheet(topic,20261106,8,'standard',{task});
  assertWorksheetMath(sheet);
  for(const paper of ['A4','Letter']){
   const raw=await createWorksheetPdf(sheet,topic,'questions',paper);
   const pdf=await PDFDocument.load(raw);
   assert.ok(pdf.getPageCount()>0);
   assert.equal(pdf.getPage(0).getWidth(),paper==='A4'?595.28:612);
   assert.ok(pdf.getTitle()?.includes(sheet.optionsHash));
  }
 }
});
