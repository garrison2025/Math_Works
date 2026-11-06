import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {readFileSync} from 'node:fs';
import {makeWorksheet} from '../src/lib/math.ts';
import {createDivisionStoryPack,verifyDivisionStoryPack} from '../src/lib/division-word-problems.ts';
import {createDivisionStoryPdf} from '../src/lib/division-word-problems-pdf.ts';
import sourceAudit from '../src/data/seo-intent-r63.json' with {type:'json'};
import originalAudit from '../src/data/seo-intent-review.json' with {type:'json'};
import capability from '../src/data/seo-r73-division-stories-capability.json' with {type:'json'};
import routes from '../src/data/routes.json' with {type:'json'};
import {releasePaths} from '../src/lib/indexation.ts';

const modes=['mixed','equal-sharing','full-groups','round-up','leftovers'];
test('R73 exact integer division and real contextual remainder meaning across 3000 deterministic questions',()=>{
 let count=0;
 for(const mode of modes)for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,17,20261106,4294967295]){
  const pack=createDivisionStoryPack('division-worksheets',seed,40,difficulty,mode);
  assert.deepEqual(pack,createDivisionStoryPack('division-worksheets',seed,40,difficulty,mode));
  assert.equal(pack.problems.length,40);
  assert.equal(new Set(pack.problems.map(x=>x.question)).size,40);
  assert.doesNotThrow(()=>verifyDivisionStoryPack(pack));
  for(const p of pack.problems){
   assert.equal(BigInt(p.dividend),BigInt(p.divisor)*BigInt(p.quotient)+BigInt(p.remainder));
   assert.ok(p.remainder>=0&&p.remainder<p.divisor);
   if(p.type==='equal-sharing'){
    assert.equal(p.remainder,0);
    assert.match(p.answer,new RegExp('^'+p.quotient+' '));
   }else if(p.type==='full-groups'){
    assert.ok(p.remainder>0);
    assert.match(p.answer,new RegExp('^'+p.quotient+' full '));
    assert.match(p.answer,new RegExp('and '+p.remainder+' '));
   }else if(p.type==='round-up'){
    assert.ok(p.divisor>=5&&p.divisor<=9,'Minibus/shuttle capacity must remain plausible');
    assert.ok(p.remainder>0);
    assert.match(p.answer,new RegExp('^'+(p.quotient+1)+' '));
   }else if(p.type==='leftovers'){
    assert.ok(p.remainder>0);
    assert.match(p.answer,new RegExp('^'+p.remainder+' '));
   }
   assert.ok(p.steps[1].includes('Check: '+p.divisor+' × '+p.quotient+' + '+p.remainder+' = '+p.dividend+'.'));
   if(mode!=='mixed')assert.equal(p.type,mode);
   count++;
  }
  if(mode==='mixed')assert.equal(new Set(pack.problems.map(x=>x.type)).size,4);
 }
 assert.equal(count,3000);
});
test('R73 every context has a semantically different answer for same quotient and remainder',()=>{
 const packs=modes.slice(1).map(mode=>createDivisionStoryPack('division-worksheets',20261106,8,'standard',mode));
 for(const p of packs.flatMap(x=>x.problems))
  assert.ok(p.question.includes(String(p.dividend))&&p.question.includes(String(p.divisor)));
 assert.ok(packs.every(p=>p.problems.every(q=>q.type==='round-up'?(q.answer.endsWith(' minibuses')||q.answer.endsWith(' shuttles')):q.answer.includes(q.type==='leftovers'?'left over':q.type==='full-groups'?'left over':'per '))));
});
test('R73 30 actual Letter/A4 real PDF student, answer and worked step combinations',async()=>{
 let count=0;
 for(const mode of modes)for(const paper of ['A4','Letter']){
  const pack=createDivisionStoryPack('division-worksheets',20261106,8,'standard',mode);
  for(const output of ['questions','answers','steps']){
   const pdf=await PDFDocument.load(await createDivisionStoryPdf(pack,output,paper));
   assert.equal(pdf.getPageCount(),2);
   assert.ok(Math.abs(pdf.getPage(0).getWidth()-(paper==='A4'?595.28:612))<.1);
   assert.ok(Math.abs(pdf.getPage(0).getHeight()-(paper==='A4'?841.89:792))<.1);
   assert.match(pdf.getTitle()??'',/R73\.1/);
   assert.match(pdf.getTitle()??'',new RegExp(output));
   count++;
  }
 }
 assert.equal(count,30);
});
test('R73 40 question stress on Letter/A4, extra writing room and worked steps pagination',async()=>{
 const pack=createDivisionStoryPack('division-worksheets',19,40,'challenge','mixed');
 for(const paper of ['A4','Letter']){
  const normal=await PDFDocument.load(await createDivisionStoryPdf(pack,'questions',paper));
  const spacious=await PDFDocument.load(await createDivisionStoryPdf(pack,'questions',paper,'extra'));
  const key=await PDFDocument.load(await createDivisionStoryPdf(pack,'answers',paper));
  const steps=await PDFDocument.load(await createDivisionStoryPdf(pack,'steps',paper));
  assert.equal(normal.getPageCount(),8);
  assert.equal(spacious.getPageCount(),10);
  assert.equal(key.getPageCount(),8);
  assert.equal(steps.getPageCount(),10);
 }
});
test('R73 tampered context, quotient, remainder, answer and steps fail closed',async()=>{
 assert.throws(()=>createDivisionStoryPack('word-problems-worksheets',1,8),/route/);
 assert.throws(()=>createDivisionStoryPack('division-worksheets',-1,8),/seed/);
 assert.throws(()=>createDivisionStoryPack('division-worksheets',1,41),/1–40/);
 assert.throws(()=>createDivisionStoryPack('division-worksheets',1,8,'unknown'),/difficulty/);
 assert.throws(()=>createDivisionStoryPack('division-worksheets',1,8,'standard','fractions'),/mode/);
 const pack=createDivisionStoryPack('division-worksheets',20261106,8,'standard','mixed');
 for(const field of ['dividend','divisor','quotient','remainder','question','answer','context','steps']){
  const changed=structuredClone(pack);
  if(field==='steps')changed.problems[0].steps[2]='This is wrong.';
  else if(field==='question'||field==='answer')changed.problems[0][field]='Incorrect interpretation';
  else changed.problems[0][field]+=1;
  assert.throws(()=>verifyDivisionStoryPack(changed),'Invalid '+field+' must be rejected');
  await assert.rejects(()=>createDivisionStoryPdf(changed,'answers','A4'));
 }
 await assert.rejects(()=>createDivisionStoryPdf(pack,'draft','A4'));
 await assert.rejects(()=>createDivisionStoryPdf(pack,'answers','Legal'));
});
test('R73 retain all v18 integer facts and exact owner-provided word-problem keyword evidence',()=>{
 const original=makeWorksheet('division-worksheets',20261106,8,'standard');
 createDivisionStoryPack('division-worksheets',20261106,40,'standard','mixed');
 assert.equal(original.generatorVersion,'18');
 assert.deepEqual(makeWorksheet('division-worksheets',20261106,8,'standard'),original);
 const csv=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8');
 const historical=[...originalAudit.flagged,...sourceAudit.issues],tick=String.fromCharCode(96);
 assert.equal(capability.keywordCapabilityUpdates.length,2);
 for(const term of capability.keywordCapabilityUpdates){
  const line=csv.split(/\r?\n/).find(x=>x.startsWith(tick+term.keyword+tick+','));
  assert.ok(line,'Invented historical keyword '+term.keyword);
  const f=line.split(',');
  assert.equal(Number(f[1]),term.sourceMonthlyVolume);
  assert.equal(Number(f[2]),term.sourceKD);
  assert.ok(line.endsWith(tick+'/division-worksheets/'+tick));
  assert.ok(historical.some(x=>x.slug==='division-worksheets'&&x.keyword===term.keyword&&x.classification==='unsupported'));
 }
 assert.equal(capability.indexApproved,false);
 assert.deepEqual(releasePaths({site:'https://math-works.pages.dev',enabled:'true',
  routes:routes.map(r=>r.slug).join(','),branch:'main'},routes),[]);
});
