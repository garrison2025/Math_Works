import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createDecimalDivisionPack,verifyDecimalDivisionPack,parseExactDecimal,
 decimalTextExact} from '../src/lib/decimal-division.ts';
import {createDecimalDivisionPdf} from '../src/lib/decimal-division-pdf.ts';

// An intentionally separate integer-power-of-ten oracle: no reliance on
// generator answer/step verifiers or floating-point calculations.
function independentDecimal(raw){
 assert.match(raw,/^(?:0|[1-9]\d*)(?:\.\d{1,5})?$/);
 const [whole,fraction='']=raw.split('.');
 const d=10n**BigInt(fraction.length);
 return {n:BigInt(whole)*d+BigInt(fraction||'0'),d};
}
function quotientIsExact(q){
 const a=independentDecimal(q.dividend),b=independentDecimal(q.divisor),c=independentDecimal(q.answer);
 assert.ok(a.n>0n&&b.n>0n&&c.n>0n);
 assert.equal(a.n*b.d*c.d,b.n*a.d*c.n,
  'R67 independent BigInt cross-multiplication rejected '+q.question+' => '+q.answer);
 assert.equal(q.question,'Calculate: '+q.dividend+' ÷ '+q.divisor+' = ____');
 assert.equal(q.divisorKind,q.divisor.includes('.')?'decimal':'whole');
 assert.equal(q.precision,q.answer.split('.')[1].length===1?'tenths':'hundredths');
 const base=10n**BigInt(Math.max(a.d.toString().length-1,b.d.toString().length-1));
 assert.equal(q.scaleFactor,Number(base));
 assert.equal(q.scaledDividend,String(a.n*(base/a.d)));
 assert.equal(q.scaledDivisor,String(b.n*(base/b.d)));
 const s='Check: '+q.divisor+' × '+q.answer+' = '+q.dividend+'.';
 assert.equal(q.steps[2],s);
}
test('R67 exhaustive presets x difficulty x seeds verify exact quotients and deterministic distinct question signatures',()=>{
 let total=0;
 for(const mode of ['mixed','whole','decimal'])
 for(const precision of ['mixed','tenths','hundredths'])
 for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,17,20261106,4294967295]){
  const pack=createDecimalDivisionPack('division-worksheets',seed,40,difficulty,mode,precision);
  assert.deepEqual(pack,createDecimalDivisionPack('division-worksheets',seed,40,difficulty,mode,precision));
  assert.equal(pack.questions.length,40);
  assert.equal(new Set(pack.questions.map(q=>q.question)).size,40);
  assert.doesNotThrow(()=>verifyDecimalDivisionPack(pack));
  for(const q of pack.questions){
   quotientIsExact(q);
   if(mode!=='mixed')assert.equal(q.divisorKind,mode);
   if(precision!=='mixed')assert.equal(q.precision,precision);
   assert.equal(q.steps.length,3);
   total++;
  }
 }
 assert.equal(total,5400);
});
test('R67 decimals are exact integers or terminating powers of ten; repeating rational rendering fails',()=>{
 for(const [n,d,expected] of [
  [1n,10n,'0.1'],[1n,100n,'0.01'],[1n,1000n,'0.001'],
  [120n,10n,'12'],[72n,8n,'9'],[1n,20n,'0.05'],[51n,2n,'25.5']
 ]){
  const value={n,d};
  // The renderer accepts canonical reduced rationals created by generator,
  // so input here is normalized manually.
  const gcd=(a,b)=>b===0n?a:gcd(b,a%b),k=gcd(n,d);
  assert.equal(decimalTextExact({n:n/k,d:d/k}),expected);
 }
 assert.throws(()=>decimalTextExact({n:1n,d:3n}),/Repeating decimal/);
 for(const raw of ['1/3','-2.5','1.234567','01.20','1.','3e5','NaN','0.00.1'])
  assert.throws(()=>parseExactDecimal(raw),/Invalid exact/);
});
test('R67 matching A4 and Letter question, answer and worked-step PDF variants',async()=>{
 let count=0;
 for(const mode of ['mixed','whole','decimal'])for(const precision of ['tenths','hundredths'])
 for(const paper of ['A4','Letter']){
  const pack=createDecimalDivisionPack('division-worksheets',20261106,8,'standard',mode,precision);
  for(const output of ['questions','answers','steps']){
   const doc=await PDFDocument.load(await createDecimalDivisionPdf(pack,output,paper));
   assert.equal(doc.getPageCount(),output==='steps'?2:1);
   assert.ok(Math.abs(doc.getPage(0).getWidth()-(paper==='A4'?595.28:612))<.1);
   assert.ok(Math.abs(doc.getPage(0).getHeight()-(paper==='A4'?841.89:792))<.1);
   assert.match(doc.getTitle()||'',new RegExp('R67.1'));
   assert.match(doc.getTitle()||'',new RegExp(output));
   assert.match(doc.getSubject()||'',/independent of integer generator v18/);
   count++;
  }
 }
 assert.equal(count,36);
});
test('R67 40-question 5-page student PDF and extra writing room increase it to 7 pages',async()=>{
 const pack=createDecimalDivisionPack('division-worksheets',20261106,40,'challenge','decimal','hundredths');
 for(const paper of ['A4','Letter']){
  const student=await PDFDocument.load(await createDecimalDivisionPdf(pack,'questions',paper));
  const spaced=await PDFDocument.load(await createDecimalDivisionPdf(pack,'questions',paper,'extra'));
  const answers=await PDFDocument.load(await createDecimalDivisionPdf(pack,'answers',paper));
  const steps=await PDFDocument.load(await createDecimalDivisionPdf(pack,'steps',paper));
  assert.equal(student.getPageCount(),5);
  assert.equal(answers.getPageCount(),5);
  assert.equal(spaced.getPageCount(),7);
  assert.equal(steps.getPageCount(),8);
 }
});
test('R67 adversarial wrong answer, corrupted scaled values, duplicate questions and invalid request fail closed',async()=>{
 assert.throws(()=>createDecimalDivisionPack('addition-worksheets',1,8),/Unsupported/);
 assert.throws(()=>createDecimalDivisionPack('division-worksheets',-1,8),/seed/);
 assert.throws(()=>createDecimalDivisionPack('division-worksheets',1,0),/1–40/);
 assert.throws(()=>createDecimalDivisionPack('division-worksheets',1,8,'hard'),/difficulty/);
 assert.throws(()=>createDecimalDivisionPack('division-worksheets',1,8,'easy','fraction'),/divisor type/);
 assert.throws(()=>createDecimalDivisionPack('division-worksheets',1,8,'easy','whole','thousandths'),/precision/);
 const a=createDecimalDivisionPack('division-worksheets',13,8,'standard','mixed','mixed');
 const x=structuredClone(a);x.questions[0].answer='999.9';
 assert.throws(()=>verifyDecimalDivisionPack(x),/mismatch/);
 const y=structuredClone(a);y.questions[0].scaledDividend='14';
 assert.throws(()=>verifyDecimalDivisionPack(y),/scaling mismatch/);
 const z=structuredClone(a);z.questions[1]=structuredClone(z.questions[0]);z.questions[1].id='Q2';
 assert.throws(()=>verifyDecimalDivisionPack(z),/mismatch/);
 await assert.rejects(()=>createDecimalDivisionPdf(a,'draft','A4'),/PDF mode/);
 await assert.rejects(()=>createDecimalDivisionPdf(a,'answers','Legal'),/paper/);
});
test('R67 original integer division facts and all deterministic v18 contracts are unaffected',()=>{
 const before=makeWorksheet('division-worksheets',20261106,8,'standard',{divisor:'mixed'});
 createDecimalDivisionPack('division-worksheets',20261106,40,'challenge','whole','hundredths');
 createDecimalDivisionPack('division-worksheets',20261106,40,'challenge','decimal','tenths');
 assert.deepEqual(makeWorksheet('division-worksheets',20261106,8,'standard',{divisor:'mixed'}),before);
 assert.equal(before.generatorVersion,'18');
});
