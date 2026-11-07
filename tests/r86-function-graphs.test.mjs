import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import r62 from '../src/data/seo-intent-review.json' with {type:'json'};
import r63 from '../src/data/seo-intent-r63.json' with {type:'json'};
import cap from '../src/data/seo-r86-function-graphs-capability.json' with {type:'json'};
import {makeWorksheet} from '../src/lib/math.ts';
import {EXTRA_PACK_KEYS,buildExtraPackLink,parseExtraPackLink} from '../src/lib/extra-pack-link.ts';
import {createGraphPack,verifyGraphPack,graphToPaper,GRAPH_MODES} from '../src/lib/r86-function-graphs.ts';
import {createGraphPdf} from '../src/lib/r86-function-graphs-pdf.ts';
test('R86: 2,400 reproducible exact function tasks with independent graph coordinates',()=>{
 let count=0;
 for(const mode of GRAPH_MODES)
 for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,17,20261107,4294967295]){
  const pack=createGraphPack(seed,40,difficulty,mode);
  assert.deepEqual(pack,createGraphPack(seed,40,difficulty,mode));
  verifyGraphPack(pack);
  assert.equal(pack.problems.length,40);
  // In read-graph mode the question text is intentionally the same,
  // but the drawn function is different. Compare graph identities.
  assert.equal(new Set(pack.problems.map(p=>
   [p.kind,p.m,p.b,p.a,p.h,p.k,p.probeX].join('|'))).size,40);
  if(mode==='mixed')assert.deepEqual(new Set(pack.problems.map(p=>p.kind)),
   new Set(['linear-graph','read-graph','quadratic-transform']));
  for(const [index,p] of pack.problems.entries()){
   assert.equal(p.id,'Q'+(index+1));
   assert.equal(p.steps.length,3);
   const kind=mode==='mixed'?['linear-graph','read-graph','quadratic-transform'][index%3]:mode;
   assert.equal(p.kind,kind);
   for(const point of p.plottedPoints){
    const exact=kind==='quadratic-transform'?
     p.a*(point.x-p.h)**2+p.k:p.m*point.x+p.b;
    assert.equal(point.y,exact,'Independent integer graph value mismatch');
    assert.ok(point.x>=-6&&point.x<=6&&point.y>=-6&&point.y<=6);
   }
   if(kind==='quadratic-transform'){
    assert.ok(p.a!==0);
    assert.deepEqual(p.plottedPoints.map(q=>q.x),[p.h-1,p.h,p.h+1]);
    assert.equal(p.plottedPoints[1].y,p.k);
    assert.match(p.answer,new RegExp('Vertex \\('+p.h+','+p.k+'\\)'));
    assert.match(p.answer,/opens up|opens down/);
   }else{
    assert.ok(p.m!==0);
    assert.equal(p.plottedPoints.find(q=>q.x===0)?.y,p.b);
    assert.ok(p.answer.includes('(0,'+p.b+')'));
    if(kind==='read-graph')assert.ok(p.answer.includes('f('+p.probeX+') = '+(p.m*p.probeX+p.b)));
   }
   count++;
  }
 }
 assert.equal(count,2400);
});
test('R86 geometric oracle: axes have 1:1 physical unit scale and exact origin, negative coords',()=>{
 for(const step of [8.5,13.75,20]){
  const start=321,bottom=152;
  const zero=graphToPaper(0,0,start,bottom,step);
  assert.equal(zero.x,start+6*step);
  assert.equal(zero.y,bottom+6*step);
  const ex=graphToPaper(1,0,start,bottom,step),ey=graphToPaper(0,1,start,bottom,step);
  assert.equal(ex.x-zero.x,ey.y-zero.y);
  const negative=graphToPaper(-6,-6,start,bottom,step);
  assert.deepEqual(negative,{x:start,y:bottom});
  assert.deepEqual(graphToPaper(6,6,start,bottom,step),{x:start+12*step,y:bottom+12*step});
 }
 assert.throws(()=>graphToPaper(0,0,10,20,0));
});
test('R86 tampered points, math, step and seed are detected before PDF export',async()=>{
 const pack=createGraphPack(20261107,8,'standard','mixed');
 for(const change of [
  p=>{p.problems[0].plottedPoints[0].y++;},
  p=>{p.problems[1].answer='no answer';},
  p=>{p.problems[2].k++;},
  p=>{p.problems[0].steps[2]='incorrect intercept';},
  p=>{p.problems[1].kind='quadratic-transform';}
 ]){
  const bad=structuredClone(pack);change(bad);
  assert.throws(()=>verifyGraphPack(bad));
  await assert.rejects(createGraphPdf(bad,'questions','A4'));
 }
 assert.throws(()=>createGraphPack(-1,8));
 assert.throws(()=>createGraphPack(20261107,41));
 assert.throws(()=>createGraphPack(20261107,8,'standard','invalid'));
});
test('R86 24 actual A4/Letter student, teacher and worked graph PDFs',async()=>{
 let n=0;
 for(const mode of GRAPH_MODES)for(const paper of ['A4','Letter'])
 for(const edition of ['questions','answers','steps']){
  const pack=createGraphPack(20261107,8,'standard',mode);
  const bytes=await createGraphPdf(pack,edition,paper,'standard');
  const pdf=await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(),4);
  assert.ok(Math.abs(pdf.getPage(0).getWidth()-(paper==='A4'?595.28:612))<.1);
  assert.match(pdf.getTitle()??'',new RegExp('R86 '+mode+' '+edition));
  assert.ok(bytes.length>4000);
  n++;
 }
 assert.equal(n,24);
});
test('R86 40-question maximum = 20 pages; v18 preview unaffected; shared optional mode roundtrips',async()=>{
 const original=makeWorksheet('functions-worksheets',20261104,8,'standard');
 const pack=createGraphPack(20261107,40,'challenge','mixed');
 const pdf=await PDFDocument.load(await createGraphPdf(pack,'steps','Letter','extra'));
 assert.equal(pdf.getPageCount(),20);
 assert.deepEqual(makeWorksheet('functions-worksheets',20261104,8,'standard'),original);
 assert.equal(EXTRA_PACK_KEYS.length,30);
 const key='r86-graph-mode',opts=[{key,allowed:GRAPH_MODES,defaultValue:'mixed',selectedValue:'quadratic-transform'}];
 const base='https://math-works.pages.dev/functions-worksheets/?gv=18&seed=20261107&quantity=8';
 const share=buildExtraPackLink(base,opts);
 assert.equal(new URL(share).searchParams.get('xp_'+key),'quadratic-transform');
 assert.deepEqual(parseExtraPackLink(share,opts),{[key]:'quadratic-transform'});
 assert.equal(parseExtraPackLink(share.replace('xpv=1','xpv=9'),opts)[key],undefined);
});
test('R86 three exact historical unsupported source keywords, original CSV and index hold intact',()=>{
 const flags=[...r62.flagged,...r63.issues];
 assert.equal(cap.keywordCapabilityUpdates.length,3);
 for(const row of cap.keywordCapabilityUpdates){
  assert.equal(flags.filter(x=>x.slug===row.actualPage&&x.keyword===row.keyword&&x.classification==='unsupported').length,1);
 }
 assert.equal(cap.original488Edited,false);
 assert.equal(cap.originalV18Edited,false);
 assert.equal(cap.indexApproved,false);
 assert.equal(cap.physicalPrinter,'NOT RUN');
});
