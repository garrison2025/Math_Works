import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createDotPlotPack,verifyDotPlotPack} from '../src/lib/statistical-dot-plot.ts';
import {createDotPlotPdf} from '../src/lib/statistical-dot-plot-pdf.ts';
import {releasePaths} from '../src/lib/indexation.ts';
import routes from '../src/data/routes.json' with {type:'json'};
const tasks=['mixed','plot','frequency','mode','median','range'];
test('R77 3,600 independently recomputed real frequency dot plots with exact statistics',()=>{
 let questions=0,plots=0,reads=0;
 for(const mode of tasks)for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,17,20261106,4294967295]){
  const pack=createDotPlotPack('mean-median-mode-range-worksheets',seed,40,difficulty,mode);
  assert.deepEqual(pack,createDotPlotPack('mean-median-mode-range-worksheets',seed,40,difficulty,mode));
  verifyDotPlotPack(pack);
  for(const p of pack.problems){
   assert.equal(p.observations.length,p.frequencies.reduce((a,b)=>a+b,0));
   assert.ok(p.observations.length>=8&&p.observations.length<=16);
   const frequency=Array.from({length:10},(_,i)=>p.observations.filter(v=>v===i+1).length);
   assert.deepEqual(p.frequencies,frequency);
   assert.ok(Math.max(...frequency)<=5&&Math.max(...frequency)>=2);
   const ordered=[...p.observations].sort((a,b)=>a-b);
   assert.deepEqual(ordered,p.observations);
   const middle=ordered.length%2?ordered[(ordered.length-1)/2]:
    (ordered[ordered.length/2-1]+ordered[ordered.length/2])/2;
   const top=Math.max(...frequency),modes=frequency.flatMap((n,i)=>n===top?[i+1]:[]);
   const range=ordered.at(-1)-ordered[0];
   if(p.kind==='plot'){
    assert.equal(p.answer,'Dots: '+frequency.map((n,i)=>(i+1)+':'+n).join(', '));
    plots++;
   }else if(p.kind==='frequency'){
    assert.equal(p.answer,String(frequency[p.targetValue-1]));reads++;
   }else if(p.kind==='mode'){
    assert.equal(p.answer,modes.join(', '));reads++;
   }else if(p.kind==='median'){
    assert.equal(p.answer,String(middle));reads++;
   }else{assert.equal(p.answer,String(range));reads++;}
   assert.equal(p.steps.length,3);
   questions++;
  }
 }
 assert.equal(questions,3600);
 assert.ok(plots>0&&reads>0);
});
test('R77 36 real PDF samples at A4/Letter preserve page dimensions, 3 distinct outputs',async()=>{
 let count=0;
 for(const mode of tasks)for(const paper of ['Letter','A4'])
 for(const output of ['questions','answers','steps']){
  const pack=createDotPlotPack('mean-median-mode-range-worksheets',20261106,8,'standard',mode);
  const file=await PDFDocument.load(await createDotPlotPdf(pack,output,paper,'extra'));
  assert.equal(file.getPageCount(),3);
  assert.equal(Math.round(file.getPage(0).getWidth()),paper==='Letter'?612:595);
  assert.equal(Math.round(file.getPage(0).getHeight()),paper==='Letter'?792:842);
  assert.match(file.getTitle()??'',/R77\.1/);
  assert.match(file.getTitle()??'',new RegExp(output));
  count++;
 }
 assert.equal(count,36);
});
test('R77 reject corrupt seed, source frequencies, answers, metadata and solution editing',async()=>{
 const p=createDotPlotPack('mean-median-mode-range-worksheets',20261106,40,'challenge');
 assert.equal((await PDFDocument.load(await createDotPlotPdf(p,'answers','A4'))).getPageCount(),14);
 for(const field of ['frequencies','observations','answer','steps','question','targetValue']){
  const wrong=structuredClone(p);
  if(field==='frequencies')wrong.problems[0].frequencies[0]++;
  if(field==='observations')wrong.problems[0].observations[0]++;
  if(field==='answer')wrong.problems[0].answer='INCORRECT';
  if(field==='steps')wrong.problems[0].steps[1]='INCORRECT';
  if(field==='question')wrong.problems[0].question='INCORRECT';
  if(field==='targetValue')wrong.problems[0].targetValue=0;
  assert.throws(()=>verifyDotPlotPack(wrong));
  await assert.rejects(()=>createDotPlotPdf(wrong,'questions','Letter'));
 }
 assert.throws(()=>createDotPlotPack('mean-median-mode-range-worksheets',-1,8),/seed/);
 assert.throws(()=>createDotPlotPack('mean-median-mode-range-worksheets',5,41),/1-40/);
 await assert.rejects(()=>createDotPlotPdf(p,'invalid','A4'),/mode/);
});
test('R77 preserves original 51 routes, v18 statistics, noindex and 488 historical SEO terms',()=>{
 const before=makeWorksheet('mean-median-mode-range-worksheets',20261106,8,'standard');
 createDotPlotPack('mean-median-mode-range-worksheets',20261106,8);
 assert.deepEqual(makeWorksheet('mean-median-mode-range-worksheets',20261106,8,'standard'),before);
 assert.equal(before.generatorVersion,'18');
 const csv=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8');
 assert.equal(csv.trimEnd().split('\n').length-1,488);
 assert.equal(routes.length,51);
 assert.deepEqual(releasePaths({site:'https://math-works.pages.dev',enabled:'true',
  routes:routes.map(r=>r.slug).join(','),branch:'main'},routes),[]);
});
