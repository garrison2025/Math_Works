import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {readFileSync} from 'node:fs';
import {makeWorksheet} from '../src/lib/math.ts';
import {createMultDivisionPack,verifyMultDivisionPack} from '../src/lib/multiplication-division-practice.ts';
import {createMultDivisionPdf} from '../src/lib/multiplication-division-practice-pdf.ts';
import cap from '../src/data/seo-r71-mult-div-capability.json' with {type:'json'};
import r63 from '../src/data/seo-intent-r63.json' with {type:'json'};
import r62 from '../src/data/seo-intent-review.json' with {type:'json'};

function independent(q,index){
 assert.equal(q.a*q.b,q.product);
 assert.equal(q.facts.length,4);
 assert.deepEqual(q.facts,[
  q.a+' × '+q.b+' = '+q.product,q.b+' × '+q.a+' = '+q.product,
  q.product+' ÷ '+q.a+' = '+q.b,q.product+' ÷ '+q.b+' = '+q.a
 ]);
 if(q.mode==='fact-family'){
  assert.equal(q.operator,'family');
  assert.equal(q.answer,q.facts.join(' | '));
  assert.equal(q.area,null);
 }else if(q.mode==='area-model'){
  assert.equal(q.operator,'model');
  assert.ok(q.area);
  const aParts=q.area.rows,bParts=q.area.columns;
  assert.equal(aParts.reduce((a,b)=>a+b),q.a);
  assert.equal(bParts.reduce((a,b)=>a+b),q.b);
  assert.ok(aParts.length===2);
  assert.ok(bParts.length===1||bParts.length===2);
  const observed=q.area.cells;
  assert.equal(observed.length,aParts.length);
  for(const [i,row] of observed.entries())
   for(const [j,product] of row.entries())
    assert.equal(product,aParts[i]*bParts[j]);
  assert.equal(observed.flat().reduce((a,b)=>a+b,0),q.product);
  assert.equal(q.answer,String(q.product));
  assert.match(q.question,/^Partition an area model to multiply /);
  assert.match(q.steps[2],/Add partial areas:/);
 }else{
  const m=q.question.match(/^(\d+) ([×÷]) (\d+) = ____$/);
  assert.ok(m,'Wrong mixed arithmetic question '+q.question);
  const [left,right]=[BigInt(m[1]),BigInt(m[3])];
  assert.equal(BigInt(q.answer),m[2]==='×'?left*right:left/right);
  assert.ok(m[2]!=='÷'||left%right===0n);
  assert.equal(q.operator,index%2===0?'multiply':'divide');
  assert.ok(q.area===null);
 }
}
test('R71 3 honest modes across 3 difficulties x 5 seeds create 40 distinct exact questions and reproduce',()=>{
 let count=0;
 for(const topic of ['multiplication-worksheets','division-worksheets'])
 for(const mode of topic==='division-worksheets'?['mixed-facts','fact-family']:['mixed-facts','fact-family','area-model'])
 for(const factors of mode==='area-model'?['mixed','two-by-one','two-by-two']:['mixed'])
 for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,7,20261106,4294967295]){
  const p=createMultDivisionPack(topic,seed,40,difficulty,mode,factors);
  assert.deepEqual(p,createMultDivisionPack(topic,seed,40,difficulty,mode,factors));
  assert.equal(p.questions.length,40);
  assert.doesNotThrow(()=>verifyMultDivisionPack(p));
  assert.equal(new Set(p.questions.map(q=>q.question)).size,40);
  for(const [i,q] of p.questions.entries()){
   independent(q,i);count++;
   if(mode==='area-model'&&factors!=='mixed')
    assert.equal(q.area.columns.length,factors==='two-by-one'?1:2);
  }
  if(mode==='mixed-facts')assert.ok(p.questions.some(q=>q.operator==='multiply')&&p.questions.some(q=>q.operator==='divide'));
 }
 assert.equal(count,4200);
});
test('R71 realistic A4/Letter student, answer and worked vector PDFs across all task forms',async()=>{
 let count=0;
 for(const topic of ['multiplication-worksheets','division-worksheets'])
 for(const mode of topic==='division-worksheets'?['mixed-facts','fact-family']:['mixed-facts','fact-family','area-model'])
 for(const paper of ['A4','Letter']){
  const p=createMultDivisionPack(topic,20261106,8,'standard',mode,'mixed');
  for(const output of ['questions','answers','steps']){
   const doc=await PDFDocument.load(await createMultDivisionPdf(p,output,paper));
   assert.equal(doc.getPageCount(),mode==='mixed-facts'?1:2);
   assert.ok(Math.abs(doc.getPage(0).getWidth()-(paper==='A4'?595.28:612))<.1);
   assert.ok(Math.abs(doc.getPage(0).getHeight()-(paper==='A4'?841.89:792))<.1);
   assert.match(doc.getTitle()??'',/R71\.1/);
   assert.match(doc.getTitle()??'',new RegExp(output));
   assert.match(doc.getSubject()??'',/independent of original integer generator v18/);
   count++;
  }
 }
 assert.equal(count,30);
});
test('R71 40-problem PDF pagination and non-leaking student/teacher variance',async()=>{
 for(const mode of ['mixed-facts','fact-family','area-model']){
  for(const paper of ['A4','Letter']){
   const p=createMultDivisionPack('multiplication-worksheets',13,40,'challenge',mode);
   const student=await PDFDocument.load(await createMultDivisionPdf(p,'questions',paper));
   const teacher=await PDFDocument.load(await createMultDivisionPdf(p,'answers',paper));
   assert.equal(student.getPageCount(),mode==='mixed-facts'?5:8);
   assert.equal(teacher.getPageCount(),mode==='mixed-facts'?5:8);
  }
 }
});
test('R71 fail-closed corrupted products, area partials, inverse facts, answer keys and bad mode',async()=>{
 assert.throws(()=>createMultDivisionPack('addition-worksheets',1,8),/topic/);
 assert.throws(()=>createMultDivisionPack('multiplication-worksheets',-1,8),/Seed/);
 assert.throws(()=>createMultDivisionPack('multiplication-worksheets',1,0),/1–40/);
 assert.throws(()=>createMultDivisionPack('multiplication-worksheets',1,8,'expert'),/difficulty/);
 assert.throws(()=>createMultDivisionPack('multiplication-worksheets',1,8,'standard','lattice'),/mode/);
 assert.throws(()=>createMultDivisionPack('division-worksheets',1,8,'standard','area-model'),/only/);
 const family=createMultDivisionPack('multiplication-worksheets',42,8,'standard','fact-family');
 const area=createMultDivisionPack('multiplication-worksheets',42,8,'standard','area-model');
 for(const field of ['answer','question','product','facts']){
  const a=structuredClone(family);
  if(field==='product')a.questions[0].product+=1;
  else if(field==='facts')a.questions[0].facts[3]='99 ÷ 11 = 99';
  else a.questions[0][field]='invalid';
  assert.throws(()=>verifyMultDivisionPack(a));
  await assert.rejects(()=>createMultDivisionPdf(a,'answers','A4'));
 }
 const hacked=structuredClone(area);hacked.questions[0].area.cells[0][0]+=1;
 assert.throws(()=>verifyMultDivisionPack(hacked),/mismatch/);
 await assert.rejects(()=>createMultDivisionPdf(area,'draft','A4'),/PDF mode/);
 await assert.rejects(()=>createMultDivisionPdf(area,'answers','Legal'),/paper/);
});
test('R71 new packs do not alter the original v18 seeded 51 generator contracts',()=>{
 for(const topic of ['multiplication-worksheets','division-worksheets']){
  const before=makeWorksheet(topic,20261106,8,'standard');
  createMultDivisionPack(topic,20261106,40,'standard','mixed-facts');
  createMultDivisionPack(topic,20261106,40,'standard','fact-family');
  if(topic==='multiplication-worksheets')createMultDivisionPack(topic,20261106,40,'standard','area-model');
  assert.deepEqual(makeWorksheet(topic,20261106,8,'standard'),before);
  assert.equal(before.generatorVersion,'18');
 }
});
test('R71 eight owner source keywords are exact, historically unsupported, and new functionality has no index permission',()=>{
 assert.equal(cap.schema,'mathworks-r71-mult-div-capability/v1');
 assert.equal(cap.keywordCapabilityUpdates.length,8);
 const src=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8').split(/\r?\n/);
 const quote=String.fromCharCode(96);
 const flags=[...r62.flagged,...r63.issues];
 for(const row of cap.keywordCapabilityUpdates){
  const original=src.find(line=>line.startsWith(quote+row.keyword+quote+','));
  assert.ok(original,'Missing exact source phrase '+row.keyword);
  const fields=original.split(',');
  assert.equal(Number(fields[1]),row.sourceMonthlyVolume);
  assert.equal(Number(fields[2]),row.sourceKD);
  assert.ok(original.endsWith(quote+'/'+row.ownerOriginalRoute+'/'+quote));
  assert.ok(flags.some(f=>f.keyword===row.keyword&&f.slug===row.ownerOriginalRoute&&f.classification==='unsupported'));
 }
 assert.equal(cap.indexApproved,false);
 assert.equal(cap.rankVerified,false);
});
