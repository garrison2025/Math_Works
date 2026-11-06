import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createMixedSolidPack,verifyMixedSolidPack} from '../src/lib/mixed-prism-cylinder-pack.ts';
import {createMixedSolidPdf} from '../src/lib/mixed-prism-cylinder-pdf.ts';
import old from '../src/data/seo-intent-review.json' with {type:'json'};
import r63 from '../src/data/seo-intent-r63.json' with {type:'json'};
import cap from '../src/data/seo-r79-mixed-solids-capability.json' with {type:'json'};
const topics=['volume-of-rectangular-prisms-worksheets','surface-area-worksheets'];
const modes=['mixed','rectangular-prism','triangular-prism','cylinder'];
test('R79 4,800 independent per-shape exact math oracles plus true mixed composition',()=>{
 let count=0;
 for(const topic of topics)for(const mode of modes)
 for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,17,20261107,4294967295]){
  const p=createMixedSolidPack(topic,seed,40,difficulty,mode);
  verifyMixedSolidPack(p);
  assert.deepEqual(p,createMixedSolidPack(topic,seed,40,difficulty,mode));
  assert.equal(new Set(p.problems.map(x=>x.question)).size,40);
  if(mode==='mixed')assert.deepEqual([...new Set(p.problems.map(x=>x.kind))].sort(),['cylinder','rectangular-prism','triangular-prism']);
  for(const q of p.problems){
   const task=topic==='surface-area-worksheets'?'surface':'volume';
   assert.equal(q.task,task);
   const unit=q.unit+(task==='surface'?'²':'³');
   let expected='';
   if(q.kind==='rectangular-prism'){
    expected=String(task==='volume'?q.l*q.w*q.h:2*(q.l*q.w+q.l*q.h+q.w*q.h))+' '+unit;
   }else if(q.kind==='triangular-prism'){
    assert.equal(q.a*q.a+q.b*q.b,q.c*q.c);
    const base=q.a*q.b/2;
    expected=String(task==='volume'?base*q.length:q.a*q.b+(q.a+q.b+q.c)*q.length)+' '+unit;
   }else{
    expected=String(task==='volume'?q.radius*q.radius*q.height:
     2*q.radius*q.radius+2*q.radius*q.height)+'π '+unit;
   }
   assert.equal(q.answer,expected);
   assert.equal(q.steps.length,3);
   count++;
  }
 }
 assert.equal(count,4800);
});
test('R79 A4/Letter 48 true mixed solid PDFs all have 3 distinct printed pages',async()=>{
 let n=0;
 for(const topic of topics)for(const mode of modes)for(const paper of ['A4','Letter'])
 for(const output of ['questions','answers','steps']){
  const p=createMixedSolidPack(topic,20261107,8,'standard',mode);
  const pdf=await PDFDocument.load(await createMixedSolidPdf(p,output,paper,'extra'));
  assert.equal(pdf.getPageCount(),3);
  assert.equal(Math.round(pdf.getPage(0).getWidth()),paper==='A4'?595:612);
  assert.equal(Math.round(pdf.getPage(0).getHeight()),paper==='A4'?842:792);
  assert.match(pdf.getTitle()??'',/R79\.1/);
  assert.match(pdf.getTitle()??'',new RegExp(output));
  n++;
 }
 assert.equal(n,48);
});
test('R79 40-question stress and edited dimensions/teacher answers reject altered packs',async()=>{
 for(const topic of topics){
  const pack=createMixedSolidPack(topic,20261107,40,'challenge','mixed');
  const pdf=await PDFDocument.load(await createMixedSolidPdf(pack,'steps','Letter'));
  assert.equal(pdf.getPageCount(),14);
  for(const field of ['l','w','h','a','b','c','length','radius','height','answer','steps','question']){
   const bad=structuredClone(pack);
   if(field==='answer'||field==='question')bad.problems[0][field]='wrong';
   else if(field==='steps')bad.problems[0].steps[0]='wrong';
   else bad.problems[0][field]++;
   assert.throws(()=>verifyMixedSolidPack(bad));
   await assert.rejects(()=>createMixedSolidPdf(bad,'answers','A4'));
  }
  assert.deepEqual(makeWorksheet(topic,20261107,8,'standard'),makeWorksheet(topic,20261107,8,'standard'));
  assert.equal(makeWorksheet(topic,20261107,8,'standard').generatorVersion,'18');
 }
 assert.throws(()=>createMixedSolidPack(topics[0],-1,8),/seed/);
 assert.throws(()=>createMixedSolidPack(topics[0],20261107,41),/1-40/);
 await assert.rejects(()=>createMixedSolidPdf(createMixedSolidPack(topics[0],20261107,8),'wrong','A4'));
});
test('R79 historic keyword credit limited to exactly two original unsupported rows',()=>{
 assert.equal(cap.keywordCapabilityUpdates.length,2);
 const flags=[...old.flagged,...r63.issues];
 const csv=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8').split(/\r?\n/);
 assert.equal(csv.filter(s=>s.startsWith('`')).length,488);
 for(const item of cap.keywordCapabilityUpdates){
  const r=csv.find(s=>s.startsWith('`'+item.keyword+'`,'));
  assert.ok(r,'keyword absent from original user CSV');
  assert.equal(Number(r.split(',')[1]),item.sourceMonthlyVolume);
  assert.equal(Number(r.split(',')[2]),item.sourceKD);
  assert.ok(flags.some(f=>f.keyword===item.keyword&&f.classification==='unsupported'));
 }
 assert.equal(cap.previewNoindex,true);
 assert.equal(cap.approvedForIndexing,false);
});
