import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createTrianglePack,verifyTrianglePack} from '../src/lib/triangle-inequality-pack.ts';
import {createCompositePack,verifyCompositePack} from '../src/lib/composite-area-pack.ts';
import {createR75GeometryPdf} from '../src/lib/r75-geometry-pdf.ts';
import cap from '../src/data/seo-r75-geometry-capability.json' with {type:'json'};
import old from '../src/data/seo-intent-review.json' with {type:'json'};
import newer from '../src/data/seo-intent-r63.json' with {type:'json'};
import routes from '../src/data/routes.json' with {type:'json'};
import {releasePaths} from '../src/lib/indexation.ts';
const triangleModes=['mixed','possible','missing-side','integer-count'];
const areaModes=['mixed','subtract','split'];
test('R75 2400 deterministic triangle exercises with independent strict inequality oracle',()=>{
 let count=0,possible=0,notPossible=0;
 for(const mode of triangleModes)for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,17,20261106,4294967295]){
  const pack=createTrianglePack('inequalities-worksheets',seed,40,difficulty,mode);
  assert.deepEqual(pack,createTrianglePack('inequalities-worksheets',seed,40,difficulty,mode));
  verifyTrianglePack(pack);
  assert.equal(new Set(pack.problems.map(p=>p.question)).size,40);
  for(const p of pack.problems){
   const min=Math.abs(p.a-p.b),max=p.a+p.b;
   assert.equal(p.lower,min);assert.equal(p.upper,max);
   if(p.kind==='possible'){
    const list=[p.a,p.b,p.c].sort((a,b)=>a-b);
    const valid=list[0]+list[1]>list[2];
    assert.equal(p.valid,valid);
    assert.equal(p.answer,valid?'Yes - a triangle is possible':'No - a triangle is impossible');
    if(valid)possible++;else notPossible++;
   }else if(p.kind==='missing-side'){
    assert.equal(p.answer,min+' < x < '+max+' (x in '+p.unit+')');
    assert.equal(p.c,0);
   }else{
    const brute=Array.from({length:max+1},(_,i)=>i).filter(x=>x>min&&x<max).length;
    assert.equal(brute,p.answer.startsWith(String(brute))?brute:-1);
    assert.equal(brute,2*Math.min(p.a,p.b)-1);
   }
   count++;
  }
 }
 assert.equal(count,2400);
 assert.ok(possible>0&&notPossible>0);
});
test('R75 1800 true L-shaped composite areas: two independent nonoverlapping partitions',()=>{
 let count=0;
 for(const mode of areaModes)for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,17,20261106,4294967295]){
  const pack=createCompositePack('area-worksheets',seed,40,difficulty,mode);
  assert.deepEqual(pack,createCompositePack('area-worksheets',seed,40,difficulty,mode));
  verifyCompositePack(pack);
  assert.equal(new Set(pack.problems.map(p=>p.question)).size,40);
  for(const p of pack.problems){
   const W=p.outerWidth,H=p.outerHeight,w=p.cutWidth,h=p.cutHeight;
   assert.ok(W>w&&H>h);
   const polygon=[[0,0],[W,0],[W,H-h],[W-w,H-h],[W-w,H],[0,H]];
   let signed=0;for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length];
    signed+=a[0]*b[1]-b[0]*a[1];
   }
   const shoelace=Math.abs(signed)/2;
   const subtraction=W*H-w*h;
   const addition=(W-w)*H+w*(H-h);
   assert.equal(shoelace,subtraction);
   assert.equal(shoelace,addition);
   assert.equal(p.area,shoelace);
   assert.equal(p.answer,shoelace+' '+p.unit+'²');
   count++;
  }
 }
 assert.equal(count,1800);
});
test('R75 12 true A4/Letter PDF exports, 3-page student and independent teacher/steps',async()=>{
 let files=0;
 for(const paper of ['A4','Letter'])for(const output of ['questions','answers','steps'])
 for(const kind of ['triangle','composite']){
  const pack=kind==='triangle'?createTrianglePack('inequalities-worksheets',20261106,8):
    createCompositePack('area-worksheets',20261106,8);
  const pdf=await PDFDocument.load(await createR75GeometryPdf(pack,output,paper,'extra'));
  assert.equal(pdf.getPageCount(),3);
  assert.equal(Math.round(pdf.getPage(0).getWidth()),paper==='A4'?595:612);
  assert.equal(Math.round(pdf.getPage(0).getHeight()),paper==='A4'?842:792);
  assert.match(pdf.getTitle()??'',/R75\.1/);assert.match(pdf.getTitle()??'',new RegExp(output));
  files++;
 }
 assert.equal(files,12);
});
test('R75 end-to-end 40-problem and invalid metadata/answer tampering fail closed',async()=>{
 for(const kind of ['triangle','composite']){
  const pack=kind==='triangle'?createTrianglePack('inequalities-worksheets',20261106,40,'challenge'):
   createCompositePack('area-worksheets',20261106,40,'challenge');
  for(const paper of ['Letter','A4']){
   const pdf=await PDFDocument.load(await createR75GeometryPdf(pack,'questions',paper));
   assert.equal(pdf.getPageCount(),14);
  }
  for(const field of ['answer','question','steps']){
   const changed=structuredClone(pack);
   if(field==='steps')changed.problems[0].steps[1]='The math is wrong.';
   else changed.problems[0][field]='Altered output';
   if(kind==='triangle')assert.throws(()=>verifyTrianglePack(changed));
   else assert.throws(()=>verifyCompositePack(changed));
   await assert.rejects(()=>createR75GeometryPdf(changed,'answers','Letter'));
  }
  const incorrect=structuredClone(pack);
  if(kind==='triangle')incorrect.problems[0].a++;
  else incorrect.problems[0].cutWidth++;
  await assert.rejects(()=>createR75GeometryPdf(incorrect,'steps','A4'));
 }
 assert.throws(()=>createTrianglePack('inequalities-worksheets',-1,8),/seed/);
 assert.throws(()=>createCompositePack('area-worksheets',20261106,41),/1-40/);
 await assert.rejects(()=>createR75GeometryPdf(createTrianglePack('inequalities-worksheets',5,8),'invalid','A4'));
});
test('R75 historical exact 488-row source-backed unsupported keywords and original v18 kept stable',()=>{
 const csv=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8').split(/\r?\n/);
 assert.equal(cap.keywordCapabilityUpdates.length,2);
 const hist=[...old.flagged,...newer.issues];
 for(const item of cap.keywordCapabilityUpdates){
  const row=csv.find(x=>x.startsWith('`'+item.keyword+'`,'));
  assert.ok(row,'Invented original keyword: '+item.keyword);
  assert.equal(Number(row.split(',')[1]),item.sourceMonthlyVolume);
  assert.equal(Number(row.split(',')[2]),item.sourceKD);
  assert.ok(hist.some(x=>x.keyword===item.keyword&&x.classification==='unsupported'));
 }
 const oldT=makeWorksheet('inequalities-worksheets',20261106,8,'standard');
 const oldA=makeWorksheet('area-worksheets',20261106,8,'standard');
 createTrianglePack('inequalities-worksheets',20261106,8,'standard');
 createCompositePack('area-worksheets',20261106,8,'standard');
 assert.deepEqual(makeWorksheet('inequalities-worksheets',20261106,8,'standard'),oldT);
 assert.deepEqual(makeWorksheet('area-worksheets',20261106,8,'standard'),oldA);
 assert.equal(oldT.generatorVersion,'18');assert.equal(oldA.generatorVersion,'18');
 assert.equal(cap.previewNoindex,true);assert.equal(cap.indexApproved,false);
 assert.deepEqual(releasePaths({site:'https://math-works.pages.dev',enabled:'true',
  routes:routes.map(r=>r.slug).join(','),branch:'main'},routes),[]);
});
