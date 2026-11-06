import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createInequalityPracticePack,verifyInequalityPracticePack} from '../src/lib/inequality-practice.ts';
import {createCircleAreaPack,verifyCircleAreaPack} from '../src/lib/circle-area-practice.ts';
import {createR74PracticePdf} from '../src/lib/r74-practice-pdf.ts';
import capability from '../src/data/seo-r74-math-capability.json' with {type:'json'};
import sourceA from '../src/data/seo-intent-review.json' with {type:'json'};
import sourceB from '../src/data/seo-intent-r63.json' with {type:'json'};
import routes from '../src/data/routes.json' with {type:'json'};
import {releasePaths} from '../src/lib/indexation.ts';
const modes=['mixed','translate','and','or'];
const circleModes=['mixed','radius','diameter','semicircle','quarter-circle','sector','missing-radius'];
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
test('R74 3000 deterministic inequalities: true bounds, correct words, closed/open endpoints and set operation',()=>{
 let checked=0;
 for(const mode of modes)for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,17,20261106,4294967295]){
  const p=createInequalityPracticePack('inequalities-worksheets',seed,50/1-10,difficulty,mode);
  assert.deepEqual(p,createInequalityPracticePack('inequalities-worksheets',seed,40,difficulty,mode));
  verifyInequalityPracticePack(p);
  assert.equal(p.problems.length,40);
  assert.equal(new Set(p.problems.map(x=>x.question)).size,40);
  if(mode==='mixed')assert.deepEqual(new Set(p.problems.map(x=>x.kind)),new Set(['translate','and','or']));
  for(const x of p.problems){
   if(x.kind==='translate'){
    const v=x.bound,k=x.constant;
    assert.ok(k>0);
    if(x.context===0){assert.equal(x.answer,`x + ${k} ≤ ${v+k}`);assert.equal(x.graph.kind,'left');assert.equal(x.graph.closedLeft,true);}
    if(x.context===1){assert.equal(x.answer,`x - ${k} ≥ ${v-k}`);assert.equal(x.graph.kind,'right');assert.equal(x.graph.closedRight,true);}
    if(x.context===2){assert.equal(x.answer,`${k}x < ${v*k}`);assert.equal(x.graph.kind,'left');assert.equal(x.graph.closedLeft,false);}
    if(x.context===3){assert.equal(v%k,0);assert.equal(x.answer,`x / ${k} > ${v/k}`);assert.equal(x.graph.kind,'right');assert.equal(x.graph.closedRight,false);}
   }else{
    assert.ok(x.lower<x.upper);
    if(x.kind==='and'){
     assert.equal(x.answer,`${x.lower} ${x.closedLeft?'≤':'<'} x ${x.closedRight?'≤':'<'} ${x.upper}`);
     assert.equal(x.graph.kind,'between');
    }else{
     assert.equal(x.answer,`x ${x.closedLeft?'≤':'<'} ${x.lower} or x ${x.closedRight?'≥':'>'} ${x.upper}`);
     assert.equal(x.graph.kind,'outside');
    }
    assert.equal(x.graph.lower,x.lower);assert.equal(x.graph.upper,x.upper);
    assert.equal(x.graph.closedLeft,x.closedLeft);assert.equal(x.graph.closedRight,x.closedRight);
   }
   checked++;
  }
 }
 assert.equal(checked,2400);
});
test('R74 4200 circle and sector problems: independent rational-pi oracle, dimensions and squared units',()=>{
 let count=0;
 for(const mode of circleModes)for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,17,20261106,4294967295]){
  const p=createCircleAreaPack('area-worksheets',seed,40,difficulty,mode);
  assert.deepEqual(p,createCircleAreaPack('area-worksheets',seed,40,difficulty,mode));
  verifyCircleAreaPack(p);
  assert.equal(new Set(p.problems.map(x=>x.question)).size,40);
  if(mode==='mixed')assert.equal(new Set(p.problems.map(x=>x.kind)).size,6);
  for(const x of p.problems){
   const angle=x.kind==='semicircle'?180:x.kind==='quarter-circle'?90:x.kind==='sector'?x.degrees:360;
   assert.equal(x.areaNumerator*360,x.radius*x.radius*angle*x.areaDenominator);
   assert.equal(gcd(x.areaNumerator,x.areaDenominator),1);
   if(x.kind==='missing-radius')assert.equal(x.answer,x.radius+' '+x.unit);
   else {assert.ok(x.answer.includes('π'));assert.ok(x.answer.endsWith(x.unit+'²'));}
   assert.ok(x.question.includes(x.unit));
   if(x.kind==='sector')assert.ok([30,45,60,72,90,120,135,150,180].includes(x.degrees));
   if(x.kind==='diameter')assert.ok(x.question.includes(String(x.radius*2)));
   count++;
  }
 }
 assert.equal(count,4200);
});
test('R74 12 generated true PDFs, A4/Letter student-key-steps separation',async()=>{
 let files=0;
 for(const mode of ['questions','answers','steps'])for(const paper of ['A4','Letter'])
 for(const topic of ['inequalities-worksheets','area-worksheets']){
  const pack=topic==='inequalities-worksheets'?
   createInequalityPracticePack(topic,20261106,8,'standard','mixed'):
   createCircleAreaPack(topic,20261106,8,'standard','mixed');
  const bytes=await createR74PracticePdf(pack,mode,paper,'extra');
  const pdf=await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(),2);
  assert.equal(Math.round(pdf.getPage(0).getWidth()),paper==='A4'?595:612);
  assert.equal(Math.round(pdf.getPage(0).getHeight()),paper==='A4'?842:792);
  assert.match(pdf.getTitle()??'',/R74\.1/);
  assert.match(pdf.getTitle()??'',new RegExp(mode));
  files++;
 }
 assert.equal(files,12);
});
test('R74 tampering, unknown contexts, invalid settings and original v18 compatibility',async()=>{
 const badI=createInequalityPracticePack('inequalities-worksheets',17,8,'standard','mixed');
 for(const mutate of [
  p=>p.problems[0].answer='x > 999',
  p=>p.problems[0].graph.lower=999,
  p=>p.problems[0].steps[0]='This is incorrect',
  p=>p.problems[0].question='Fabricated problem'
 ]){
  const t=structuredClone(badI);mutate(t);assert.throws(()=>verifyInequalityPracticePack(t));
  await assert.rejects(()=>createR74PracticePdf(t,'answers','Letter'));
 }
 const badC=createCircleAreaPack('area-worksheets',17,8);
 for(const mutate of [
  p=>p.problems[0].areaNumerator++,
  p=>p.problems[0].answer='42',
  p=>p.problems[0].radius++,
  p=>p.problems[0].degrees=900
 ]){
  const t=structuredClone(badC);mutate(t);assert.throws(()=>verifyCircleAreaPack(t));
  await assert.rejects(()=>createR74PracticePdf(t,'steps','A4'));
 }
 assert.throws(()=>createCircleAreaPack('area-worksheets',-1,8),/seed/);
 assert.throws(()=>createInequalityPracticePack('inequalities-worksheets',17,41),/1–40/);
 await assert.rejects(()=>createR74PracticePdf(badC,'wrong','A4'));
 await assert.rejects(()=>createR74PracticePdf(badI,'questions','Legal'));
 const beforeA=makeWorksheet('area-worksheets',20261106,8,'standard');
 const beforeI=makeWorksheet('inequalities-worksheets',20261106,8,'standard');
 createCircleAreaPack('area-worksheets',20261106,40,'challenge','sector');
 createInequalityPracticePack('inequalities-worksheets',20261106,40,'challenge','or');
 assert.deepEqual(makeWorksheet('area-worksheets',20261106,8,'standard'),beforeA);
 assert.deepEqual(makeWorksheet('inequalities-worksheets',20261106,8,'standard'),beforeI);
 assert.equal(beforeA.generatorVersion,'18');assert.equal(beforeI.generatorVersion,'18');
});
test('R74 five real historical unsupported source keywords, no invented SEO evidence or preview indexing',()=>{
 const rows=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8').split(/\r?\n/);
 const hist=[...sourceA.flagged,...sourceB.issues];
 assert.equal(capability.keywordCapabilityUpdates.length,5);
 for(const item of capability.keywordCapabilityUpdates){
  const row=rows.find(x=>x.startsWith('`'+item.keyword+'`,'));
  assert.ok(row,'Not in original owner Semrush file: '+item.keyword);
  assert.equal(Number(row.split(',')[1]),item.sourceMonthlyVolume);
  assert.equal(Number(row.split(',')[2]),item.sourceKD);
  assert.ok(hist.some(x=>x.keyword===item.keyword&&x.classification==='unsupported'));
 }
 assert.equal(capability.indexApproved,false);
 assert.deepEqual(releasePaths({site:'https://math-works.pages.dev',enabled:'true',
  routes:routes.map(r=>r.slug).join(','),branch:'main'},routes),[]);
});
