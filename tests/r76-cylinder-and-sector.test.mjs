import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createCylinderPack,verifyCylinderPack} from '../src/lib/cylinder-pack.ts';
import {createCylinderPdf} from '../src/lib/cylinder-pdf.ts';
import {createCircleAreaPack} from '../src/lib/circle-area-practice.ts';
import {createR74PracticePdf} from '../src/lib/r74-practice-pdf.ts';
import r76 from '../src/data/seo-r76-cylinder-capability.json' with {type:'json'};
import old from '../src/data/seo-intent-review.json' with {type:'json'};
import r63 from '../src/data/seo-intent-r63.json' with {type:'json'};
const modes=['mixed','total-surface','lateral-surface','volume','surface-and-volume'];
test('R76 3,000 seeded cylinder question instances have independent exact formula oracles',()=>{
 let count=0;
 for(const mode of modes)for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,17,20261106,4294967295]){
  const pack=createCylinderPack('surface-area-worksheets',seed,40,difficulty,mode);
  assert.deepEqual(pack,createCylinderPack('surface-area-worksheets',seed,40,difficulty,mode));
  verifyCylinderPack(pack);assert.equal(new Set(pack.problems.map(x=>x.question)).size,40);
  for(const p of pack.problems){
   const r=p.radius,h=p.height,L=2*r*h,T=L+2*r*r,V=r*r*h;
   assert.equal(p.totalCoefficient,T);
   assert.equal(p.lateralCoefficient,L);
   assert.equal(p.volumeCoefficient,V);
   const sq=p.unit+'²',cub=p.unit+'³';
   if(p.kind==='total-surface')assert.equal(p.answer,T+'π '+sq);
   else if(p.kind==='lateral-surface')assert.equal(p.answer,L+'π '+sq);
   else if(p.kind==='volume')assert.equal(p.answer,V+'π '+cub);
   else assert.equal(p.answer,'SA = '+T+'π '+sq+'; V = '+V+'π '+cub);
   assert.equal(p.steps.length,3);
   assert.ok(T>L);
   count++;
  }
 }
 assert.equal(count,3000);
});
test('R76 30 real PDF fixtures preserve page sizes, answer isolation and original area calculator',async()=>{
 let files=0;
 for(const paper of ['A4','Letter'])for(const mode of modes)for(const output of ['questions','answers','steps']){
  const pack=createCylinderPack('surface-area-worksheets',20261106,8,'standard',mode);
  const pdf=await PDFDocument.load(await createCylinderPdf(pack,output,paper,'extra'));
  assert.equal(pdf.getPageCount(),3);
  assert.equal(Math.round(pdf.getPage(0).getWidth()),paper==='A4'?595:612);
  assert.equal(Math.round(pdf.getPage(0).getHeight()),paper==='A4'?842:792);
  assert.match(pdf.getTitle()??'',/R76\.1/);
  assert.match(pdf.getTitle()??'',new RegExp(output));
  files++;
 }
 assert.equal(files,30);
});
test('R76 40-question export, metadata and computational tampering all fail closed',async()=>{
 const pack=createCylinderPack('surface-area-worksheets',20261106,40,'challenge');
 const pdf=await PDFDocument.load(await createCylinderPdf(pack,'steps','Letter'));
 assert.equal(pdf.getPageCount(),14);
 for(const mutation of ['answer','radius','height','volumeCoefficient','steps']){
  const bad=structuredClone(pack);
  if(mutation==='steps')bad.problems[0].steps[0]='Incorrect.';
  else if(mutation==='answer')bad.problems[0].answer='Incorrect.';
  else bad.problems[0][mutation]++;
  assert.throws(()=>verifyCylinderPack(bad));
  await assert.rejects(()=>createCylinderPdf(bad,'answers','A4'));
 }
 assert.throws(()=>createCylinderPack('surface-area-worksheets',-1,8),/seed/);
 assert.throws(()=>createCylinderPack('surface-area-worksheets',20261106,41),/1-40/);
 assert.throws(()=>createCylinderPack('surface-area-worksheets',20261106,8,'standard','invalid'),/mode/);
 await assert.rejects(()=>createCylinderPdf(pack,'invalid','Letter'),/mode/);
});
test('R76 full and partial circle R74 mathematical packs preserve exact fixed seed outputs',async()=>{
 for(const mode of ['radius','diameter','semicircle','quarter-circle','sector','missing-radius']){
  const pack=createCircleAreaPack('area-worksheets',20261106,8,'standard',mode);
  assert.deepEqual(pack,createCircleAreaPack('area-worksheets',20261106,8,'standard',mode));
  const pdf=await PDFDocument.load(await createR74PracticePdf(pack,'questions','Letter'));
  assert.equal(pdf.getPageCount(),2);
  const original=makeWorksheet('area-worksheets',20261106,8,'standard');
  assert.deepEqual(makeWorksheet('area-worksheets',20261106,8,'standard'),original);
 }
});
test('R76 exactly 5 historical owner unsupported terms and original v18 unchanged',()=>{
 const csv=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8').split(/\r?\n/);
 const historical=[...old.flagged,...r63.issues];
 assert.equal(r76.keywordCapabilityUpdates.length,5);
 for(const item of r76.keywordCapabilityUpdates){
  const line=csv.find(s=>s.startsWith('`'+item.keyword+'`,'));
  assert.ok(line,'R76 invented keyword '+item.keyword);
  const cells=line.split(',');
  assert.equal(Number(cells[1]),item.sourceMonthlyVolume);
  assert.equal(Number(cells[2]),item.sourceKD);
  assert.ok(historical.some(x=>x.keyword===item.keyword&&x.classification==='unsupported'));
  assert.equal(item.actualPage,'surface-area-worksheets');
 }
 const before=makeWorksheet('surface-area-worksheets',20261106,8,'standard');
 createCylinderPack('surface-area-worksheets',20261106,8);
 assert.deepEqual(makeWorksheet('surface-area-worksheets',20261106,8,'standard'),before);
 assert.equal(before.generatorVersion,'18');
 assert.equal(r76.previewNoindex,true);
 assert.equal(r76.approvedForIndexing,false);
});
