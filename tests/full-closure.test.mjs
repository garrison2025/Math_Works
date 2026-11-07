import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {readFileSync} from 'node:fs';
import {makeWorksheet} from '../src/lib/math.ts';
import {EXTRA_PACK_KEYS,buildExtraPackLink,parseExtraPackLink} from '../src/lib/extra-pack-link.ts';
import {makeClosurePack,verifyClosurePack,CLOSURE_MODES,polynomialText,latticeDiagonals,triangularPyramidArea} from '../src/lib/closure-math.ts';
import {createClosurePdf,closurePlaneDiagramGeometry} from '../src/lib/closure-pdf.ts';
import {createMultDivisionPack,verifyMultDivisionPack} from '../src/lib/multiplication-division-practice.ts';
import cap from '../src/data/seo-closure-capability.json' with {type:'json'};
import a from '../src/data/seo-intent-review.json' with {type:'json'};
import b from '../src/data/seo-intent-r63.json' with {type:'json'};
test('Closure: 4320 deterministic math problems all five topics and twelve scoped activity modes',()=>{
 let count=0;
 for(const topic of Object.keys(CLOSURE_MODES)){
  for(const mode of CLOSURE_MODES[topic]){
   for(const difficulty of ['easy','standard','challenge']){
    for(const seed of [0,20261104,20261107]){
     const pack=makeClosurePack(topic,seed,40,difficulty,mode);
     verifyClosurePack(pack);
     assert.deepEqual(pack,makeClosurePack(topic,seed,40,difficulty,mode));
     assert.equal(pack.problems.length,40);
     assert.equal(new Set(pack.problems.map(p=>[p.kind,p.a,p.b,p.c,p.d,p.e,p.f,p.h].join('|'))).size,40);
     for(const p of pack.problems){
      assert.equal(p.topic,topic);assert.equal(p.mode,mode);
      assert.match(p.id,/^Q\d+$/);assert.equal(p.steps.length,3);
      if(topic==='angle-worksheets'){
       assert.ok(p.a+p.b>p.c&&p.b+p.c>p.a&&p.a+p.c>p.b);
       const ordered=[['a (BC)',p.a],['b (AC)',p.b],['c (AB)',p.c]].sort((x,y)=>x[1]-y[1]).map(x=>x[0]);
       if(p.kind==='order-sides')assert.equal(p.answer,ordered.join(' < '));
       else{
        const angels=[['A',p.a],['B',p.b],['C',p.c]].sort((x,y)=>x[1]-y[1]).map(x=>x[0]);
        assert.equal(p.answer,angels.join(' < '));
       }
      }
      if(topic==='mixed-addition-subtraction-worksheets'){
       const sign=p.kind==='addition'?1:-1;
       assert.equal(p.answer,polynomialText(p.a+sign*p.d,p.b+sign*p.e,p.c+sign*p.f));
      }
      if(topic==='lines-rays-segments-worksheets'){
       assert.ok(p.a>0&&p.b>0&&p.h>0);
       if(p.kind==='plane-points')assert.match(p.answer,/A, B, C/);
       if(p.kind==='line-plane')assert.match(p.answer,/at A/);
       if(p.kind==='unique-plane')assert.match(p.answer,/A, B, C/);
      }
      if(topic==='multiplication-worksheets'){
       const x=latticeDiagonals(p.a,p.b);
       assert.equal(p.answer,String(p.a*p.b));assert.equal(x.combined,p.a*p.b);
      }
      if(topic==='surface-area-worksheets'){
       const x=triangularPyramidArea(p.a,p.b,p.h);
       const rad=p.a*p.a*p.b*p.b+p.h*p.h*(p.a*p.a+p.b*p.b);
       assert.equal(x.radicand,rad);
       const independent=(p.a*p.b+p.a*p.h+p.b*p.h+Math.sqrt(rad))/2;
       assert.ok(Math.abs(x.total-independent)<1e-10);
       assert.match(p.answer,new RegExp(independent.toFixed(2).replace('.','\\.')));
      }
      count++;
     }
    }
   }
  }
 }
 assert.equal(count,4320);
});
test('Closure: illegal options, corrupted answers or modified diagrams cannot export',async()=>{
 for(const topic of Object.keys(CLOSURE_MODES)){
  const pack=makeClosurePack(topic,20261104,8,'standard');
  for(const tamper of [p=>{p.problems[0].answer='9';},
   p=>{p.problems[0].a=0;},p=>{p.problems[0].steps[0]='fabricated';},
   p=>{p.problems[0].question='fake';}]){
   const copy=structuredClone(pack);tamper(copy);
   assert.throws(()=>verifyClosurePack(copy));
   await assert.rejects(createClosurePdf(copy,'questions','A4'));
  }
 }
 assert.throws(()=>makeClosurePack('fake',0,8));
 assert.throws(()=>makeClosurePack('angle-worksheets',-1,8));
 assert.throws(()=>makeClosurePack('angle-worksheets',1,41));
 assert.throws(()=>makeClosurePack('angle-worksheets',1,8,'standard','lattice'));
});
test('Closure: 30 actual exported vector PDFs, 40 task stress and original v18 untouched',async()=>{
 let count=0;
 for(const topic of Object.keys(CLOSURE_MODES)){
  const base=makeWorksheet(topic,20261104,8,'standard');
  for(const paper of ['A4','Letter']){
   for(const edition of ['questions','answers','steps']){
    const pack=makeClosurePack(topic,20261104,8,'standard');
    const bytes=await createClosurePdf(pack,edition,paper,'standard');
    const doc=await PDFDocument.load(bytes);
    assert.equal(doc.getPageCount(),4);
    assert.equal(doc.getPage(0).getWidth(),paper==='A4'?595.28:612);
    assert.ok(bytes.length>2800);
    assert.match(doc.getTitle()??'',new RegExp('Closure '+topic));
    count++;
   }
  }
  const max=makeClosurePack(topic,20261107,40,'challenge');
  const pages=await PDFDocument.load(await createClosurePdf(max,'steps','Letter','extra'));
  assert.equal(pages.getPageCount(),20);
  assert.deepEqual(makeWorksheet(topic,20261104,8,'standard'),base);
 }
 assert.equal(count,30);
});
test('Closure: actual historic fact-family tool was already available in R71, not a new generator',()=>{
 const pack=createMultDivisionPack('multiplication-worksheets',20261104,8,'standard','fact-family');
 verifyMultDivisionPack(pack);
 assert.equal(pack.questions.length,8);
 for(const q of pack.questions){
  assert.equal(q.mode,'fact-family');assert.equal(q.facts.length,4);
  assert.equal(q.product,q.a*q.b);
  assert.ok(q.facts.includes(q.a+' × '+q.b+' = '+q.product));
  assert.ok(q.facts.includes(q.product+' ÷ '+q.a+' = '+q.b));
 }
 assert.equal(cap.existingCapabilityUpdates[0].keyword,'division multiplication fact families worksheets');
});
test('Closure: exact 488 frozen keywords, five real new and one existing previously flagged need',()=>{
 const flags=[...a.flagged,...b.issues];
 assert.equal(cap.keywordCapabilityUpdates.length,5);assert.equal(cap.existingCapabilityUpdates.length,1);
 for(const r of [...cap.keywordCapabilityUpdates,...cap.existingCapabilityUpdates]){
  assert.equal(flags.filter(x=>x.keyword===r.keyword&&x.slug===r.actualPage&&x.classification==='unsupported').length,1);
 }
 assert.equal(cap.keywordsUnmodified,488);assert.equal(cap.notApprovedToIndex,true);
 assert.equal(cap.teacherSignoff,'NOT RUN');assert.equal(cap.physicalPrint,'NOT RUN');
});
test('Closure: 31 declared optional modes, exact specialist link restoration, honest current status',()=>{
 assert.equal(EXTRA_PACK_KEYS.length,31);
 for(const topic of Object.keys(CLOSURE_MODES)){
  const modes=CLOSURE_MODES[topic],choice=modes.at(-1);
  const options=[{key:'closure-mode',allowed:modes,defaultValue:modes[0],selectedValue:choice}];
  const base='https://math-works.pages.dev/'+topic+'/?gv=18&seed=20261104';
  const link=buildExtraPackLink(base,options);
  assert.deepEqual(parseExtraPackLink(link,options),choice!==modes[0]?{'closure-mode':choice}:{});
  assert.ok(!link.includes('student')&&!link.includes('answer='));
 }
 const status=readFileSync(new URL('../CURRENT-STATUS.md',import.meta.url),'utf8');
 assert.match(status,/\b488\b/);assert.match(status,/\b343\b/);assert.match(status,/\b63\b/);
 assert.match(status,/noindex,nofollow/);assert.match(status,/NOT YET COMPLETED/);
});

test('Closure: all plane and four-face pyramid edges use PDF-native geometry; no flipped SVG paths',()=>{
 const source=readFileSync(new URL('../src/lib/closure-pdf.ts',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\.drawSvgPath\(/,'SVG coordinate transforms must not displace PDF geometry');
 assert.match(source,/\[\[o,aa\],\[aa,bb\],\[bb,o\]\]/);
 assert.match(source,/corners\[\(i\+1\)%corners\.length\]/);
 const workspace=readFileSync(new URL('../src/client/workspace.ts',import.meta.url),'utf8');
 assert.match(workspace,/refreshSpecialExample\?\.\(\)/,
  'Programmatic shared URL settings and New set must update the current example');
});

test('R89: source instructions, share settings and latest verified main release record agree',()=>{
 const page=readFileSync(new URL('../src/pages/[slug]/index.astro',import.meta.url),'utf8');
 const workspace=readFileSync(new URL('../src/client/workspace.ts',import.meta.url),'utf8');
 const status=readFileSync(new URL('../CURRENT-STATUS.md',import.meta.url),'utf8');
 for(const obsolete of [
  'The original share link does not encode',
  'The original Copy reproducible link does not',
  'Existing algebra-inequality share URLs do not encode',
  'The original reproducible worksheet link does <strong>not</strong> encode'
 ]){
  assert.ok(!page.includes(obsolete),'outdated sharing claim: '+obsolete);
 }
 assert.match(page,/Copy reproducible link saves the decimal operation/);
 assert.match(page,/Copy reproducible link saves the selected division-story/);
 assert.match(workspace,/previewGeneration\+\+/);
 assert.match(workspace,/requestedGeneration!==previewGeneration/);
 assert.match(status,/b54f365625603fd201edc094ec6f74deb27e793c/);
 assert.match(status,/42341851522/);
 assert.doesNotMatch(status,/closure branch: CANDIDATE/);
});

test('R88: plane P contains all z=0 schematic points and excludes raised D',()=>{
 const inside=(pt,corners)=>{
  const crosses=corners.map((p,i)=>{
   const q=corners[(i+1)%corners.length];
   return (q.x-p.x)*(pt.y-p.y)-(q.y-p.y)*(pt.x-p.x);
  });
  return crosses.every(v=>v>=-1e-9);
 };
 for(const [x,y] of [[0,0],[310,215],[85,-75]]){
  const g=closurePlaneDiagramGeometry(x,y);
  for(const name of ['A','B','C'])
   assert.ok(inside(g[name],g.corners),name+' must lie within the drawn plane outline');
  assert.ok(!inside(g.D,g.corners),'D (positive z) must be outside the plane outline');
  assert.equal(g.A.x,g.D.x,'AD should visually leave plane P vertically');
  assert.ok(g.D.y>g.C.y,'D must clearly be raised above C');
 }
 assert.throws(()=>closurePlaneDiagramGeometry(Number.NaN,0));
 assert.throws(()=>closurePlaneDiagramGeometry(0,Infinity));
});
