import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {graphGeometry,cartesianAxisTicks} from '../src/lib/graph.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {sampleProblem,makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
import {assertWorksheetMath} from '../src/lib/math-release-oracle.ts';

test('R57: Cartesian labels are symmetric multiples of the interval centered on zero',()=>{
 const g={kind:'coordinate',boundX:5,boundY:7,points:[[3,4]]};
 const ticks=cartesianAxisTicks(g);
 assert.deepEqual(ticks.x,[-4,-2,0,2,4]);
 assert.deepEqual(ticks.y,[-6,-4,-2,0,2,4,6]);
 assert.deepEqual(ticks.labeledY,[-6,-4,-2,2,4,6]);
 assert.equal(ticks.stepX,2);assert.equal(ticks.stepY,2);
 const many=cartesianAxisTicks({...g,boundX:23,boundY:14});
 assert.deepEqual(many.x,[-20,-10,0,10,20]);
 assert.deepEqual(many.y,[-10,-5,0,5,10]);
 const unit=cartesianAxisTicks({...g,boundX:5,boundY:7},true);
 assert.deepEqual(unit.x,[-5,-4,-3,-2,-1,0,1,2,3,4,5]);
 assert.deepEqual(unit.labeledY,[-6,-4,-2,2,4,6]);
 for(const b of [0,-1,1.5,Infinity])
  assert.throws(()=>cartesianAxisTicks({...g,boundX:b}),/positive integer axis bounds/);
});
test('R57: 9,600 seeded graph previews have mathematically centered tick grids and one origin label',()=>{
 const cases=[
  ['coordinate-plane-worksheets',[{quadrant:'I'},{quadrant:'II'},{quadrant:'III'},{quadrant:'IV'}]],
  ['slope-worksheets',[{line:'vertical'},{line:'mixed'}]],
  ['linear-equations-worksheets',[{task:'graph',slope:'positive'},{task:'graph',slope:'negative'},
    {task:'graph',slope:'zero'},{task:'evaluate',slope:'mixed'}]]
 ];
 let total=0;
 for(const [topic,options] of cases)for(const option of options)
  for(const difficulty of ['easy','challenge'])
   for(let seed=1;seed<=480;seed++){
    const p=sampleProblem(topic,seed,difficulty,option);
    if(p.diagramSpec.kind!=='coordinate'&&p.diagramSpec.kind!=='linear-function')
     throw Error('Unexpected diagram for '+topic);
    const g=graphGeometry(p.diagramSpec),drawing=p.diagramSpec.labels?.includes('draw')??false;
    const ticks=cartesianAxisTicks(g,drawing);
    const svg=diagramSVG(p.diagramSpec);
    const sx=[...svg.matchAll(/class="cartesian-grid-x" x1="([^"]+)"/g)].map(m=>Number(m[1]));
    const sy=[...svg.matchAll(/class="cartesian-grid-y" x1="53" y1="([^"]+)"/g)].map(m=>Number(m[1]));
    assert.equal(sx.length,ticks.x.length);
    assert.equal(sy.length,ticks.y.length);
    for(let i=0;i<sx.length;i++)
     assert.ok(Math.abs(sx[i]-(225+ticks.x[i]/g.boundX*172))<1e-7);
    for(let i=0;i<sy.length;i++)
     assert.ok(Math.abs(sy[i]-(110-ticks.y[i]/g.boundY*85))<1e-7);
    assert.equal((svg.match(/class="cartesian-origin"/g)||[]).length,1);
    assert.equal(sx.filter(x=>Math.abs(x-225)<1e-8).length,1);
    assert.equal(sy.filter(y=>Math.abs(y-110)<1e-8).length,1);
    assert.ok(ticks.x.every(v=>v%ticks.stepX===0));
    assert.ok(ticks.y.every(v=>v%ticks.stepY===0));
    assert.ok(ticks.x.every((v,i)=>v===-ticks.x.at(-1-i)));
    assert.ok(ticks.y.every((v,i)=>v===-ticks.y.at(-1-i)));
    if(drawing){
     assert.doesNotMatch(svg,/solution-linear-(?:line|point)/);
     assert.match(diagramSVG(p.diagramSpec,true),/class="solution-linear-line"/);
    }
    total++;
   }
 assert.equal(total,9600);
});
test('R57: student A4 and Letter PDFs preserve original mathematics and page geometry',async()=>{
 const cases=[
  ['coordinate-plane-worksheets',{quadrant:'IV'}],
  ['slope-worksheets',{line:'mixed'}],
  ['linear-equations-worksheets',{task:'evaluate',slope:'negative'}],
  ['linear-equations-worksheets',{task:'graph',slope:'positive'}]
 ];
 for(const [topic,options] of cases){
  const sheet=makeWorksheet(topic,20261106,8,'standard',options);
  assertWorksheetMath(sheet);
  for(const paper of ['A4','Letter']){
   const bytes=await createWorksheetPdf(sheet,topic,'questions',paper);
   const pdf=await PDFDocument.load(bytes);
   assert.ok(pdf.getPageCount()>0);
   assert.ok(Math.abs(pdf.getPage(0).getWidth()-(paper==='A4'?595.28:612))<.08);
   assert.ok(pdf.getTitle().includes(sheet.optionsHash));
  }
 }
});
