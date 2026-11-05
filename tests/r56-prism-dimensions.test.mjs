import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {prismDimensions} from '../src/lib/prism-dimensions.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {sampleProblem,makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
import {assertWorksheetMath} from '../src/lib/math-release-oracle.ts';

const scenarios=[
 ['volume-of-rectangular-prisms-worksheets',{task:'volume'},'rectangular-prism'],
 ['volume-of-rectangular-prisms-worksheets',{task:'missing-height'},'rectangular-prism'],
 ['surface-area-worksheets',{solid:'rectangular-prism'},'rectangular-prism'],
 ['surface-area-worksheets',{solid:'cube'},'cube']
];
test('R56: seeded L/W/H and cube-side labels agree with diagram data and preserve hidden height',()=>{
 let count=0;
 for(const [topic,options,kind] of scenarios)
  for(const difficulty of ['easy','standard','challenge'])
   for(let seed=1;seed<=500;seed++){
    const p=sampleProblem(topic,seed,difficulty,options);
    const d=p.diagramSpec;
    assert.equal(d.kind,'prism');
    const presentation=prismDimensions(d),svg=diagramSVG(d);
    assert.equal(presentation.kind,kind);
    assert.match(svg,/class="prism-scale-note"/);
    assert.match(svg,/Schematic - not to scale/);
    assert.match(svg,/aria-label="[^"]*not to scale/);
    assert.match(svg,/class="prism-dimension prism-length"/);
    assert.ok(svg.includes('>'+presentation.lengthLabel+'</text>'));
    if(kind==='cube'){
     assert.equal(presentation.lengthLabel,'Side: '+d.values[0]);
     assert.ok(d.values.every(x=>x===d.values[0]));
     assert.equal((svg.match(/class="prism-dimension/g)||[]).length,1);
     assert.equal(presentation.heightLabel,null);
     assert.equal(presentation.widthLabel,null);
    }else{
     assert.equal(presentation.lengthLabel,'Length: '+d.values[0]);
     assert.equal(presentation.widthLabel,'Width: '+d.values[1]);
     assert.match(svg,/class="prism-dimension prism-width"/);
     assert.match(svg,/class="prism-dimension prism-height"/);
     assert.ok(svg.includes('>'+presentation.widthLabel+'</text>'));
     assert.ok(svg.includes('>'+presentation.heightLabel+'</text>'));
     assert.equal((svg.match(/class="prism-dimension/g)||[]).length,3);
     if(options.task==='missing-height'){
      assert.equal(d.values.length,2);
      assert.equal(presentation.heightLabel,'Height: ?');
      assert.ok(presentation.accessibleDescription.includes('height unknown'));
      assert.match(svg,/class="prism-dimension prism-height"[^>]*>Height: \?<\/text>/);
     }else{
      assert.equal(presentation.heightLabel,'Height: '+d.values[2]);
     }
    }
    count++;
   }
 assert.equal(count,6000);
});
test('R56: invalid or misleading cube/rectangular-prism metadata fails closed',()=>{
 for(const d of [
  {kind:'prism',values:[5],labels:[]},
  {kind:'prism',values:[5,5],labels:['cube']},
  {kind:'prism',values:[5,5,4],labels:['cube']},
  {kind:'prism',values:[0,4,8]},
  {kind:'prism',values:[3.5,4,5]},
  {kind:'prism',values:[5,6,7],labels:['unknown-solid']},
  {kind:'triangle',values:[5,6,7]}
 ])assert.throws(()=>prismDimensions(d),/prism|Cube|Unknown/);
});
test('R56: actual A4 and Letter prism/cube practice PDFs retain original seed and answers',async()=>{
 for(const [topic,options] of scenarios){
  const sheet=makeWorksheet(topic,20261106,8,'standard',options);
  assertWorksheetMath(sheet);
  for(const paper of ['Letter','A4']){
   const bytes=await createWorksheetPdf(sheet,topic,'questions',paper);
   const pdf=await PDFDocument.load(bytes);
   assert.ok(pdf.getPageCount()>0);
   assert.ok(Math.abs(pdf.getPage(0).getWidth()-(paper==='A4'?595.28:612))<.1);
   assert.match(pdf.getTitle(),/generator v18/);
   assert.match(pdf.getTitle(),new RegExp(sheet.optionsHash));
  }
 }
});
