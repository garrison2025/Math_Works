import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createDecimalAddSubPack,verifyDecimalAddSubPack,decimalUnitsText,hasDecimalRegrouping}
 from '../src/lib/decimal-add-sub.ts';
import {createDecimalAddSubPdf} from '../src/lib/decimal-add-sub-pdf.ts';
import {readFileSync} from 'node:fs';
import {releasePaths} from '../src/lib/indexation.ts';
import routes from '../src/data/routes.json' with {type:'json'};
import audit from '../src/data/seo-intent-r63.json' with {type:'json'};
import capability from '../src/data/seo-r68-decimal-add-sub-capability.json' with {type:'json'};

const topics=['addition-worksheets','subtraction-worksheets','mixed-addition-subtraction-worksheets'];
function independentUnits(value){
 assert.match(value,/^(?:0|[1-9]\d*)\.\d{1,2}$/);
 const [whole,decimal]=value.split('.');
 return {value:BigInt(whole)*10n**BigInt(decimal.length)+BigInt(decimal),places:decimal.length};
}
function independentCarryBorrow(a,b,operation){
 const aa=String(a).split('').reverse().map(Number),bb=String(b).split('').reverse().map(Number);
 let carrying=0,has=false;
 for(let i=0;i<Math.max(aa.length,bb.length);i++){
  const x=aa[i]??0,y=bb[i]??0;
  if(operation==='addition'){
   const sum=x+y+carrying;
   if(sum>=10)has=true;
   carrying=sum>=10?1:0;
  }else{
   const diff=x-y-carrying;
   if(diff<0){has=true;carrying=1}else carrying=0;
  }
 }
 return has;
}
function independentlySolve(row){
 const pattern=/^Calculate: (\d+\.\d{1,2}) ([+−]) (\d+\.\d{1,2}) = ____$/;
 const m=row.question.match(pattern);
 assert.ok(m,'User-visible expression parse failed '+row.question);
 const a=independentUnits(m[1]),b=independentUnits(m[3]),c=independentUnits(row.answer);
 assert.equal(a.places,b.places);
 assert.equal(a.places,c.places);
 const expected=m[2]==='+'?a.value+b.value:a.value-b.value;
 assert.equal(c.value,expected,'Exact independent BigInt arithmetic failed for '+row.question);
 assert.ok(c.value>0n&&c.value%10n**BigInt(c.places)!==0n);
 assert.equal(row.operation,m[2]==='+'?'addition':'subtraction');
 assert.equal(row.regrouping,independentCarryBorrow(a.value.toString(),b.value.toString(),row.operation));
 assert.equal(row.leftUnits.toString(),a.value.toString());
 assert.equal(row.rightUnits.toString(),b.value.toString());
 assert.equal(row.resultUnits.toString(),c.value.toString());
 const inverse=row.operation==='addition'?
  'Check: '+row.answer+' − '+row.b+' = '+row.a+'.':
  'Check: '+row.answer+' + '+row.b+' = '+row.a+'.';
 assert.equal(row.steps[2],inverse);
}
test('R68 all operation/precision/regrouping combinations are exact and reproducible under five varied seeds',()=>{
 let count=0;
 for(const operation of ['mixed','addition','subtraction'])
 for(const precision of ['mixed','tenths','hundredths'])
 for(const regroup of ['mixed','yes','no'])
 for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,19,20261106,4294967295]){
  const pack=createDecimalAddSubPack('subtraction-worksheets',seed,40,difficulty,operation,precision,regroup);
  assert.deepEqual(pack,createDecimalAddSubPack('subtraction-worksheets',seed,40,difficulty,operation,precision,regroup));
  assert.equal(pack.questions.length,40);
  assert.equal(new Set(pack.questions.map(q=>q.question)).size,40);
  assert.doesNotThrow(()=>verifyDecimalAddSubPack(pack));
  for(const q of pack.questions){
   independentlySolve(q);
   if(operation!=='mixed')assert.equal(q.operation,operation);
   if(precision!=='mixed')assert.equal(q.precision,precision);
   if(regroup!=='mixed')assert.equal(q.regrouping,regroup==='yes');
   count++;
  }
 }
 assert.equal(count,16200);
});
test('R68 integration on all three existing arithmetic pages keeps integer worksheet v18 unchanged',()=>{
 for(const topic of topics){
  const before=makeWorksheet(topic,20261106,8,'standard');
  for(const operation of ['mixed','addition','subtraction']){
   const p=createDecimalAddSubPack(topic,20261106,20,'standard',operation,'mixed','mixed');
   assert.equal(p.topic,topic);
   assert.equal(p.questions.length,20);
  }
  assert.deepEqual(makeWorksheet(topic,20261106,8,'standard'),before);
  assert.equal(before.generatorVersion,'18');
 }
});
test('R68 actual A4 and Letter decimal column PDFs: 54 variants and safe page counts',async()=>{
 let count=0;
 for(const topic of topics)for(const operation of ['mixed','addition','subtraction'])
 for(const paper of ['A4','Letter']){
  const pack=createDecimalAddSubPack(topic,20261106,8,'standard',operation,'hundredths','mixed');
  for(const mode of ['questions','answers','steps']){
   const bytes=await createDecimalAddSubPdf(pack,mode,paper);
   assert.ok(bytes.byteLength>900);
   const doc=await PDFDocument.load(bytes);
   assert.equal(doc.getPageCount(),mode==='steps'?2:1);
   assert.ok(Math.abs(doc.getPage(0).getWidth()-(paper==='A4'?595.28:612))<.1);
   assert.ok(Math.abs(doc.getPage(0).getHeight()-(paper==='A4'?841.89:792))<.1);
   assert.match(doc.getTitle()??'',/R68\.1/);
   assert.match(doc.getTitle()??'',new RegExp(mode));
   assert.match(doc.getSubject()??'',/separate from v18 integer generators/);
   count++;
  }
 }
 assert.equal(count,54);
});
test('R68 40 questions and extra writing room have deterministic pagination',async()=>{
 for(const paper of ['A4','Letter']){
  const pack=createDecimalAddSubPack('subtraction-worksheets',77,40,'challenge','mixed','mixed','yes');
  const student=await PDFDocument.load(await createDecimalAddSubPdf(pack,'questions',paper));
  const spacious=await PDFDocument.load(await createDecimalAddSubPdf(pack,'questions',paper,'extra'));
  const steps=await PDFDocument.load(await createDecimalAddSubPdf(pack,'steps',paper));
  assert.equal(student.getPageCount(),5);
  assert.equal(spacious.getPageCount(),7);
  assert.equal(steps.getPageCount(),8);
 }
});
test('R68 reject corrupt math, wrong carrying, explanation tampering, duplicates and invalid inputs',async()=>{
 assert.throws(()=>decimalUnitsText(-1,2),/Invalid/);
 assert.throws(()=>decimalUnitsText(10,3),/Invalid/);
 assert.throws(()=>hasDecimalRegrouping(5,10,'subtraction'),/Invalid/);
 assert.throws(()=>createDecimalAddSubPack('fractions-worksheets',1,8),/Unsupported/);
 assert.throws(()=>createDecimalAddSubPack('subtraction-worksheets',-1,8),/seed/);
 assert.throws(()=>createDecimalAddSubPack('subtraction-worksheets',1,41),/1–40/);
 assert.throws(()=>createDecimalAddSubPack('subtraction-worksheets',1,8,'hard'),/difficulty/);
 assert.throws(()=>createDecimalAddSubPack('subtraction-worksheets',1,8,'easy','division'),/operation/);
 assert.throws(()=>createDecimalAddSubPack('subtraction-worksheets',1,8,'easy','mixed','thousandths'),/precision/);
 assert.throws(()=>createDecimalAddSubPack('subtraction-worksheets',1,8,'easy','mixed','mixed','maybe'),/regrouping/);
 const p=createDecimalAddSubPack('subtraction-worksheets',23,8);
 for(const field of ['answer','a','b','question','regrouping','resultUnits','steps']){
  const c=structuredClone(p);
  if(field==='steps')c.questions[0].steps[2]='Check: 999 + 9 = 9.';
  else if(field==='regrouping')c.questions[0].regrouping=!c.questions[0].regrouping;
  else if(field==='resultUnits')c.questions[0].resultUnits+=1;
  else c.questions[0][field]='999.99';
  assert.throws(()=>verifyDecimalAddSubPack(c),'Mutation must reject: '+field);
 }
 const duplicate=structuredClone(p);duplicate.questions[1]={...duplicate.questions[0],id:'Q2'};
 assert.throws(()=>verifyDecimalAddSubPack(duplicate));
 await assert.rejects(()=>createDecimalAddSubPdf(p,'draft','A4'),/PDF mode/);
 await assert.rejects(()=>createDecimalAddSubPdf(p,'answers','Legal'),/paper/);
});
test('R68 four user-source keyword rows now have a real feature, without releasing the hub for indexing',()=>{
 assert.equal(capability.schema,'mathworks-r68-decimal-add-sub-capability/v1');
 assert.equal(capability.keywordCapabilityUpdates.length,4);
 const csv=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8');
 const all=csv.split(/\r?\n/),tick=String.fromCharCode(96);
 for(const row of capability.keywordCapabilityUpdates){
  const matched=all.find(line=>line.startsWith(tick+row.keyword+tick+','));
  assert.ok(matched,'R68 keyword is not in original CSV: '+row.keyword);
  const parts=matched.split(',');
  assert.equal(+parts[1],row.sourceVolume);
  assert.equal(+parts[2],row.sourceKD);
  assert.ok(matched.endsWith(tick+'/'+row.originalRoute+'/'+tick));
  assert.ok(audit.issues.some(item=>item.keyword===row.keyword&&
   item.slug===row.originalRoute&&item.classification==='unsupported'));
 }
 assert.deepEqual(releasePaths({site:'https://math-works.pages.dev',enabled:'true',
  routes:routes.map(r=>r.slug).join(','),branch:'main'},routes),[]);
 assert.equal(capability.indexApproved,false);
 assert.equal(capability.liveGoogleUsSerpVerified,false);
});
