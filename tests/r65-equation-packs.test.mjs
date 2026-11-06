import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {createEquationPack} from '../src/lib/equation-packs.ts';
import {createEquationPackPdf,solvePackQuestion,verifyEquationPack,parsePackValue} from '../src/lib/equation-pack-pdf.ts';
import {makeWorksheet} from '../src/lib/math.ts';

const topics=['one-step-equations-worksheets','two-step-equations-worksheets'];
const kinds=['decimal','fraction'];
function independentRational(text){
 const s=text.trim();let n,d;
 if(s.includes('/')){const v=s.split('/');n=BigInt(v[0]);d=BigInt(v[1]);}
 else if(s.includes('.')){
  const negative=s.startsWith('-')?-1n:1n;
  const unsigned=s.replace(/^-/,''),[whole,part]=unsigned.split('.');
  d=10n**BigInt(part.length);n=negative*(BigInt(whole)*d+BigInt(part));
 }else{n=BigInt(s);d=1n;}
 assert.ok(d>0n);
 return {n,d};
}
function equalRatio(a,b){return a.n*b.d===b.n*a.d;}
function independentSolve(question){
 const value='-?\\d+(?:\\.\\d{1,4}|\\/\\d+)?';
 const expr=new RegExp('^Solve: (('+value+')?x)(?: ([+−]) ('+value+'))? = ('+value+')$');
 const m=question.match(expr);assert.ok(m,'Unrecognized user-visible algebra '+question);
 const a=independentRational(m[2]||'1');
 const offset=independentRational(m[4]||'0');
 const b=m[3]==='−'?{n:-offset.n,d:offset.d}:offset;
 const c=independentRational(m[5]);
 // x=(c-b)/a, all calculations use exact BigInt arithmetic.
 return {n:(c.n*b.d-b.n*c.d)*a.d,d:c.d*b.d*a.n};
}

test('R65 4 exact equation families reproduce deterministically with distinct noninteger answers',()=>{
 for(const topic of topics)for(const kind of kinds)for(const difficulty of ['easy','standard','challenge']){
  const opts=topic.startsWith('one')?{operation:'mixed'}:{coefficient:'mixed'};
  for(const seed of [0,1,7,20261106,4294967295]){
   const pack=createEquationPack(topic,kind,seed,40,difficulty,opts);
   assert.deepEqual(pack,createEquationPack(topic,kind,seed,40,difficulty,opts));
   assert.equal(pack.questions.length,40);
   assert.equal(new Set(pack.questions.map(x=>x.question)).size,40);
   assert.doesNotThrow(()=>verifyEquationPack(pack));
   for(const row of pack.questions){
    assert.match(row.answer,/^x = /);
    const expected=independentSolve(row.question);
    const visible=independentRational(row.answer.slice(4));
    assert.ok(equalRatio(expected,visible),'Independent mathematical failure: '+row.question+' -> '+row.answer);
    assert.ok(visible.d>0n);
    assert.ok(visible.n%visible.d!==0n,'Expected noninteger decimal/fraction answer');
    assert.equal(row.steps.length,3);
    assert.match(row.steps[2],/^Check: /);
    assert.ok(!/undefined|NaN|Infinity/.test(JSON.stringify(row)));
   }
  }
 }
});
test('R65 page topic options genuinely select integer-free decimal or fractional forms',()=>{
 for(const kind of kinds)for(const operation of ['addition','multiplication']){
  const p=createEquationPack('one-step-equations-worksheets',kind,412,30,'standard',{operation});
  for(const q of p.questions){
   if(operation==='addition')assert.match(q.question,/^Solve: x [−+] /);
   else assert.match(q.question,/^Solve: -?[0-9./]+x = /);
  }
 }
 for(const kind of kinds)for(const coefficient of ['positive','negative']){
  const p=createEquationPack('two-step-equations-worksheets',kind,412,30,'standard',{coefficient});
  for(const q of p.questions){
   const factor=q.question.match(/^Solve: (-?[0-9./]+)x /);
   assert.ok(factor,'Two-step question must display coefficient');
   assert.equal(factor[1].startsWith('-'),coefficient==='negative');
  }
 }
});
test('R65 24 PDF combinations keep A4/Letter practice answers and worked steps in the same pack',async()=>{
 for(const topic of topics)for(const kind of kinds)for(const paper of ['Letter','A4']){
  const opts=topic.startsWith('one')?{operation:'multiplication'}:{coefficient:'negative'};
  const pack=createEquationPack(topic,kind,20261106,8,'challenge',opts);
  for(const mode of ['questions','answers','steps']){
   const bytes=await createEquationPackPdf(pack,mode,paper,'standard');
   assert.ok(bytes.byteLength>1000);
   const doc=await PDFDocument.load(bytes);
   assert.ok(doc.getPageCount()>0);
   const first=doc.getPage(0);
   assert.ok(Math.abs(first.getWidth()-(paper==='Letter'?612:595.28))<.1);
   assert.ok(Math.abs(first.getHeight()-(paper==='Letter'?792:841.89))<.1);
   assert.match(doc.getTitle()??'',new RegExp(mode));
   assert.match(doc.getTitle()??'',/seed 20261106/);
   assert.match(doc.getSubject()??'',/separate from the original integer generator v18/);
  }
 }
});
test('R65 print layout handles 40 questions and optional extra writing room',async()=>{
 for(const topic of topics)for(const kind of kinds){
  const pack=createEquationPack(topic,kind,929,40);
  for(const paper of ['A4','Letter']){
   const p=await PDFDocument.load(await createEquationPackPdf(pack,'questions',paper,'standard'));
   const e=await PDFDocument.load(await createEquationPackPdf(pack,'questions',paper,'extra'));
   const key=await PDFDocument.load(await createEquationPackPdf(pack,'answers',paper));
   assert.ok(p.getPageCount()>=4);
   assert.ok(e.getPageCount()>=p.getPageCount());
   assert.ok(key.getPageCount()>=2);
  }
 }
});
test('R65 all malformed settings, corrupted matching answers and duplicate rows fail closed',async()=>{
 assert.throws(()=>createEquationPack('three-step-equations-worksheets','decimal',1,8),/Unsupported/);
 assert.throws(()=>createEquationPack('one-step-equations-worksheets','binary',1,8),/number type/);
 assert.throws(()=>createEquationPack('two-step-equations-worksheets','fraction',-1,8),/seed/);
 assert.throws(()=>createEquationPack('one-step-equations-worksheets','fraction',1,0),/1–40/);
 assert.throws(()=>createEquationPack('one-step-equations-worksheets','fraction',1,8,'standard',{unknown:'yes'}),/setting/);
 assert.throws(()=>createEquationPack('two-step-equations-worksheets','decimal',1,8,'standard',{coefficient:'purple'}),/setting/);
 const p=createEquationPack('one-step-equations-worksheets','fraction',123,8);
 assert.equal(solvePackQuestion(p.questions[0].question).d>0n,true);
 p.questions[0].answer='x = 1234567';
 await assert.rejects(()=>createEquationPackPdf(p,'answers','A4'),/independent answer mismatch/);
 const invalid=createEquationPack('two-step-equations-worksheets','decimal',123,8);
 invalid.questions[1].question=invalid.questions[0].question;
 assert.throws(()=>verifyEquationPack(invalid),/row mismatch/);
 for(const x of ['1/0','1/2/3','1.234567','nan','1.2.3'])
  assert.throws(()=>parsePackValue(x));
});
test('R65 opted-in extension never mutates or re-versions the 51 existing deterministic generators',()=>{
 for(const topic of topics){
  const before=makeWorksheet(topic,20261106,8,'standard');
  createEquationPack(topic,'decimal',20261106,8,'standard',topic.startsWith('one')?{operation:'mixed'}:{coefficient:'mixed'});
  createEquationPack(topic,'fraction',20261106,8,'standard',topic.startsWith('one')?{operation:'mixed'}:{coefficient:'mixed'});
  assert.deepEqual(makeWorksheet(topic,20261106,8,'standard'),before);
  assert.equal(before.generatorVersion,'18');
 }
});
