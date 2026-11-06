import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {createFractionLinePack,fractionLinePosition,FRACTION_LINE_DENOMINATORS}
 from '../src/lib/fraction-number-lines.ts';
import {createFractionLinePdf,verifyFractionLinePack}
 from '../src/lib/fraction-number-line-pdf.ts';
import {makeWorksheet} from '../src/lib/math.ts';

const topics=['number-line-worksheets','fractions-worksheets'];
const tasks=['identify','plot'];
const ranges=['zero-one','zero-two'];
test('R66 exact rational positioning and invalid denominator/endpoint fail-closed',()=>{
 assert.deepEqual([...FRACTION_LINE_DENOMINATORS],[2,3,4,5,6,8,10,12]);
 for(const max of [1,2])for(const denominator of FRACTION_LINE_DENOMINATORS)
  for(let numerator=1;numerator<max*denominator;numerator++){
   if(max===2&&numerator===denominator)continue;
   const pos=fractionLinePosition(numerator,denominator,max);
   assert.ok(Math.abs(pos*max*denominator-numerator)<1e-11);
   assert.ok(pos>0&&pos<1);
  }
 for(const args of [[0,2,1],[2,2,1],[1,0,1],[1,7,1],[1,3,3],[3,3,2],[1.5,6,1],[1,12,0]])
  assert.throws(()=>fractionLinePosition(...args));
});
test('R66 40 exact unique problems per setting, reproducible with seed, with all original v18 generators stable',()=>{
 for(const topic of topics)for(const task of tasks)for(const range of ranges)
  for(const difficulty of ['easy','standard','challenge'])
   for(const seed of [0,1,31,20261106,4294967295]){
    const pack=createFractionLinePack(topic,seed,40,difficulty,task,range);
    assert.deepEqual(pack,createFractionLinePack(topic,seed,40,difficulty,task,range));
    assert.equal(pack.questions.length,40);
    assert.equal(new Set(pack.questions.map(x=>x.answer)).size,40);
    assert.doesNotThrow(()=>verifyFractionLinePack(pack));
    for(const [i,q] of pack.questions.entries()){
     assert.equal(q.id,'Q'+(i+1));
     assert.equal(q.answer,q.numerator+'/'+q.denominator);
     assert.equal(q.max,range==='zero-one'?1:2);
     assert.equal(q.task,task);
     assert.ok(Math.abs(fractionLinePosition(q.numerator,q.denominator,q.max)*q.max*q.denominator-q.numerator)<1e-11);
     assert.ok(q.reducedAnswer.length>0);
    }
    if(difficulty==='easy')assert.ok(pack.questions.slice(0,8).every(q=>q.denominator<=6));
   }
 for(const topic of topics){
  const original=makeWorksheet(topic,20261106,8,'standard');
  createFractionLinePack(topic,20261106,8,'standard','identify','zero-two');
  createFractionLinePack(topic,20261106,8,'standard','plot','zero-one');
  assert.deepEqual(makeWorksheet(topic,20261106,8,'standard'),original);
  assert.equal(original.generatorVersion,'18');
 }
});
test('R66 32 student/teacher PDFs have correct sizes, titles and one-page 8-question layouts',async()=>{
 let generated=0;
 for(const topic of topics)for(const task of tasks)for(const range of ranges)
  for(const paper of ['A4','Letter']){
   const pack=createFractionLinePack(topic,20261106,8,'standard',task,range);
   for(const mode of ['questions','answers']){
    const bytes=await createFractionLinePdf(pack,mode,paper);
    assert.ok(bytes.byteLength>900);
    const doc=await PDFDocument.load(bytes);
    assert.equal(doc.getPageCount(),1,'8 questions must fit on one page');
    assert.ok(Math.abs(doc.getPage(0).getWidth()-(paper==='A4'?595.28:612))<.1);
    assert.ok(Math.abs(doc.getPage(0).getHeight()-(paper==='A4'?841.89:792))<.1);
    assert.match(doc.getTitle()??'',new RegExp('R66.1'));
    assert.match(doc.getTitle()??'',new RegExp(mode));
    generated++;
   }
  }
 assert.equal(generated,32);
});
test('R66 40-question packs flow to exactly five paginated pages without clipping',async()=>{
 for(const topic of topics)for(const range of ranges)for(const paper of ['A4','Letter']){
  const pack=createFractionLinePack(topic,1,40,'easy','plot',range);
  const student=await PDFDocument.load(await createFractionLinePdf(pack,'questions',paper));
  const answer=await PDFDocument.load(await createFractionLinePdf(pack,'answers',paper));
  assert.equal(student.getPageCount(),5);
  assert.equal(answer.getPageCount(),5);
 }
});
test('R66 reject tampering, wrong metadata, wrong answer and invalid paper/modes',async()=>{
 const pack=createFractionLinePack('fractions-worksheets',17,8);
 assert.throws(()=>createFractionLinePack('unknown',1,8),/route/);
 assert.throws(()=>createFractionLinePack('fractions-worksheets',-1,8),/seed/);
 assert.throws(()=>createFractionLinePack('fractions-worksheets',1,41),/1–40/);
 assert.throws(()=>createFractionLinePack('fractions-worksheets',1,8,'standard','drill'),/task/);
 assert.throws(()=>createFractionLinePack('fractions-worksheets',1,8,'standard','plot','negatives'),/range/);
 await assert.rejects(()=>createFractionLinePdf(pack,'steps','A4'),/mode/);
 await assert.rejects(()=>createFractionLinePdf(pack,'answers','Legal'),/paper/);
 const q=structuredClone(pack);
 q.questions[0].answer='7/11';
 assert.throws(()=>verifyFractionLinePack(q),/mismatch/);
 const u=structuredClone(pack);
 u.questions[0].numerator=u.questions[0].denominator;
 assert.throws(()=>verifyFractionLinePack(u));
 const v=structuredClone(pack);
 v.questions[1].answer=v.questions[0].answer;
 assert.throws(()=>verifyFractionLinePack(v));
});
