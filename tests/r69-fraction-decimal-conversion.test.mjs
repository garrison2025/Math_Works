import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {readFileSync} from 'node:fs';
import {makeWorksheet} from '../src/lib/math.ts';
import {createFractionDecimalPack,verifyFractionDecimalPack,decimalFromThousandths}
 from '../src/lib/fraction-decimal-conversion.ts';
import {createFractionDecimalPdf} from '../src/lib/fraction-decimal-conversion-pdf.ts';
import cap from '../src/data/seo-r69-fraction-decimal-capability.json' with {type:'json'};
import audit from '../src/data/seo-intent-r63.json' with {type:'json'};
import routes from '../src/data/routes.json' with {type:'json'};
import {releasePaths} from '../src/lib/indexation.ts';
function independentRatio(input){
 const parts=input.split('/');
 assert.equal(parts.length,2);
 return [BigInt(parts[0]),BigInt(parts[1])];
}
function independentDecimal(input){
 assert.match(input,/^\d+\.\d{1,3}$/);
 const [a,b]=input.split('.');
 return [BigInt(a)*10n**BigInt(b.length)+BigInt(b),10n**BigInt(b.length)];
}
function independentGcd(a,b){
 while(b){const r=a%b;a=b;b=r;}return a;
}
function independentSolve(q){
 const [fn,fd]=independentRatio(q.fraction),[dn,dd]=independentDecimal(q.decimal);
 assert.equal(fn*dd,dn*fd,'Exact independent BigInt failure '+q.question);
 assert.equal(independentGcd(fn,fd),1n);
 assert.equal(q.kind==='fraction-to-decimal'?q.input:q.answer,q.fraction);
 assert.equal(q.kind==='fraction-to-decimal'?q.answer:q.input,q.decimal);
 assert.equal(q.question,q.kind==='fraction-to-decimal'?
  'Convert '+q.fraction+' to a decimal.':'Convert '+q.decimal+' to a simplified fraction.');
 assert.equal(q.steps.length,4);
 assert.match(q.steps[3],/^Check: /);
}
test('R69 independent exact BigInt oracle: 7,200 seeded conversion problems in both directions',()=>{
 let count=0;
 for(const direction of ['fraction-to-decimal','decimal-to-fraction','mixed'])
 for(const precision of ['tenths','hundredths','thousandths','mixed'])
 for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,19,20261106,4294967295]){
  const p=createFractionDecimalPack('fractions-worksheets',seed,40,difficulty,direction,precision);
  assert.deepEqual(p,createFractionDecimalPack('fractions-worksheets',seed,40,difficulty,direction,precision));
  assert.equal(new Set(p.questions.map(q=>q.thousandthUnits)).size,40);
  assert.doesNotThrow(()=>verifyFractionDecimalPack(p));
  for(const q of p.questions){
   independentSolve(q);
   if(direction!=='mixed')assert.equal(q.kind,direction);
   if(precision!=='mixed')assert.equal(q.places,{tenths:1,hundredths:2,thousandths:3}[precision]);
   count++;
  }
  if(direction==='mixed')assert.equal(new Set(p.questions.map(q=>q.kind)).size,2);
  if(precision==='mixed')assert.equal(new Set(p.questions.map(q=>q.places)).size,3);
 }
 assert.equal(count,7200);
});
test('R69 corrupted original, answer, numerator, denominator or steps fail closed',async()=>{
 for(const val of [0,-1,20000,1.5])assert.throws(()=>decimalFromThousandths(val));
 assert.throws(()=>createFractionDecimalPack('addition-worksheets',1,8),/Unsupported/);
 assert.throws(()=>createFractionDecimalPack('fractions-worksheets',-1,8),/seed/);
 assert.throws(()=>createFractionDecimalPack('fractions-worksheets',1,0),/1–40/);
 assert.throws(()=>createFractionDecimalPack('fractions-worksheets',1,8,'hard'),/difficulty/);
 assert.throws(()=>createFractionDecimalPack('fractions-worksheets',1,8,'easy','percent'),/direction/);
 assert.throws(()=>createFractionDecimalPack('fractions-worksheets',1,8,'easy','mixed','ten-thousandths'),/precision/);
 const original=createFractionDecimalPack('fractions-worksheets',77,8);
 for(const field of ['answer','decimal','fraction','numerator','denominator','thousandthUnits','question','steps']){
  const p=structuredClone(original);
  if(field==='steps')p.questions[0].steps[3]='Check: 2 = 7.';
  else if(['numerator','denominator','thousandthUnits'].includes(field))p.questions[0][field]+=1;
  else p.questions[0][field]='999.999';
  assert.throws(()=>verifyFractionDecimalPack(p),'Must reject altered '+field);
  await assert.rejects(()=>createFractionDecimalPdf(p,'answers','A4'));
 }
 const dup=structuredClone(original);
 dup.questions[1]={...dup.questions[0],id:'Q2'};
 assert.throws(()=>verifyFractionDecimalPack(dup));
});
test('R69 actual A4/Letter vector student, answer and step PDF modes, 54 combinations',async()=>{
 let count=0;
 for(const direction of ['fraction-to-decimal','decimal-to-fraction','mixed'])
 for(const precision of ['tenths','hundredths','thousandths'])
 for(const paper of ['A4','Letter']){
  const pack=createFractionDecimalPack('fractions-worksheets',20261106,8,'standard',direction,precision);
  for(const mode of ['questions','answers','steps']){
   const bytes=await createFractionDecimalPdf(pack,mode,paper);
   assert.ok(bytes.byteLength>900);
   const doc=await PDFDocument.load(bytes);
   assert.equal(doc.getPageCount(),mode==='steps'?2:1);
   assert.ok(Math.abs(doc.getPage(0).getWidth()-(paper==='A4'?595.28:612))<.1);
   assert.ok(Math.abs(doc.getPage(0).getHeight()-(paper==='A4'?841.89:792))<.1);
   assert.match(doc.getTitle()??'',/R69\.1/);
   assert.match(doc.getTitle()??'',new RegExp(mode));
   assert.match(doc.getSubject()??'',/separate from v18 worksheet generators/);
   count++;
  }
 }
 assert.equal(count,54);
});
test('R69 quantity 40 and extra pencil room deterministic pagination',async()=>{
 const pack=createFractionDecimalPack('fractions-worksheets',20261106,40,'challenge','mixed','mixed');
 for(const paper of ['A4','Letter']){
  const normal=await PDFDocument.load(await createFractionDecimalPdf(pack,'questions',paper));
  const extra=await PDFDocument.load(await createFractionDecimalPdf(pack,'questions',paper,'extra'));
  const teacher=await PDFDocument.load(await createFractionDecimalPdf(pack,'answers',paper));
  const steps=await PDFDocument.load(await createFractionDecimalPdf(pack,'steps',paper));
  assert.equal(normal.getPageCount(),5);
  assert.equal(extra.getPageCount(),7);
  assert.equal(teacher.getPageCount(),5);
  assert.equal(steps.getPageCount(),10);
 }
});
test('R69 four historical owner keyword rows and v18/noindex integrity',()=>{
 assert.equal(cap.schema,'mathworks-r69-fraction-decimal-conversion-capability/v1');
 assert.equal(cap.keywordCapabilityUpdates.length,4);
 const source=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8');
 const quote=String.fromCharCode(96);
 for(const term of cap.keywordCapabilityUpdates){
  const row=source.split(/\r?\n/).find(line=>line.startsWith(quote+term.keyword+quote+','));
  assert.ok(row,'Unsourced keyword '+term.keyword);
  const fields=row.split(',');
  assert.equal(+fields[1],term.sourceVolume);assert.equal(+fields[2],term.sourceKD);
  assert.ok(row.endsWith(quote+'/'+term.originalRoute+'/'+quote));
  assert.ok(audit.issues.some(issue=>issue.keyword===term.keyword&&
   issue.slug===term.originalRoute&&issue.classification==='unsupported'));
 }
 assert.equal(cap.indexApproved,false);
 const original=makeWorksheet('fractions-worksheets',20261106,8,'standard');
 createFractionDecimalPack('fractions-worksheets',20261106,40);
 assert.deepEqual(makeWorksheet('fractions-worksheets',20261106,8,'standard'),original);
 assert.equal(original.generatorVersion,'18');
 assert.deepEqual(releasePaths({site:'https://math-works.pages.dev',enabled:'true',
  routes:routes.map(x=>x.slug).join(','),branch:'main'},routes),[]);
});
