import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {makeFocusPack,verifyFocusPack,pointAngles,pointAngleSvg,FOCUS_MODES,FOCUS_LEVELS} from '../src/lib/focus-drills.ts';
import {createFocusPdf} from '../src/lib/focus-drills-pdf.ts';
import routes from '../src/data/routes.json' with {type:'json'};
const asNumber=n=>Number(n);
function independent(p){
 const q=p.question,answer=p.answer;
 if(p.kind==='multi-step'){
  const m=q.match(/^Solve (\d+)\(x ([+-]) (\d+)\) ([+-]) (\d+) = (-?\d+)\.$/);
  assert.ok(m,q);
  const a=asNumber(m[1]),b=asNumber(m[3])*(m[2]==='-'?-1:1),
   c=asNumber(m[5])*(m[4]==='-'?-1:1),rhs=asNumber(m[6]);
  assert.equal((rhs-c)%a,0,'Numerical inverse must divide exactly');
  const x=(rhs-c)/a-b;
  assert.equal(answer,'x = '+x);
  assert.equal(a*(x+b)+c,rhs);
  return;
 }
 if(p.kind==='simplify'){
  const m=q.match(/^Simplify (\d+)\(x ([+-]) (\d+)\) ([+-]) (\d+)x ([+-]) (\d+)\.$/);
  assert.ok(m,q);
  const a=asNumber(m[1]),b=asNumber(m[3])*(m[2]==='-'?-1:1),
   c=asNumber(m[5])*(m[4]==='-'?-1:1),d=asNumber(m[7])*(m[6]==='-'?-1:1);
  const am=answer.match(/^(-?)(\d*)x(?: ([+-]) (\d+))?$/);
  assert.ok(am,'Answer must be a single simplified linear expression: '+answer);
  const coeff=(am[2]?Number(am[2]):1)*(am[1]==='-'?-1:1);
  const constant=am[3]?Number(am[4])*(am[3]==='-'?-1:1):0;
  for(const x of [-19,-5,0,2,11]){
   assert.equal(a*(x+b)+c*x+d,coeff*x+constant,'Question and simplified answer are not equivalent');
  }
  return;
 }
 if(p.kind==='literal'){
  const patterns=[
   [/^Rearrange y = (\d+)x \+ (\d+)t to make x the subject\.$/,m=>'x = (y - '+m[2]+'t) / '+m[1]],
   [/^Rearrange S = (\d+)p \+ (\d+)q to make p the subject\.$/,m=>'p = (S - '+m[2]+'q) / '+m[1]],
   [/^Rearrange E = (\d+)vw to make w the subject \(v is not zero\)\.$/,m=>'w = E / ('+m[1]+'v)'],
   [/^Rearrange P = (\d+)r \+ (\d+)s to make s the subject\.$/,m=>'s = (P - '+m[1]+'r) / '+m[2]]
  ];
  const hit=patterns.map(([re,expected])=>{const m=q.match(re);return m?{m,expected}:null}).filter(Boolean);
  assert.equal(hit.length,1,'Unrecognized literal formula: '+q);
  const {m,expected}=hit[0];assert.equal(answer,expected(m));
  const a=asNumber(m[1]),b=m[2]?asNumber(m[2]):0;
  for(const x of [-10,-1,3,13]){
   const t=7;
   if(q.startsWith('Rearrange y'))assert.equal((a*x+b*t-b*t)/a,x);
   if(q.startsWith('Rearrange S'))assert.equal((a*x+b*t-b*t)/a,x);
   if(q.startsWith('Rearrange E'))assert.equal((a*t*x)/(a*t),x);
   if(q.startsWith('Rearrange P'))assert.equal((a*t+b*x-a*t)/b,x);
  }
  return;
 }
 if(p.kind==='point-angles'){
  const m=q.match(/^Four consecutive angles around point O: A = (x|\d+)°, B = (x|\d+)°, C = (x|\d+)°, D = (x|\d+)°. Find x\.$/);
  assert.ok(m,q);const sectors=m.slice(1),unknown=sectors.filter(s=>s==='x');
  assert.equal(unknown.length,1);
  const result=360-sectors.filter(s=>s!=='x').map(Number).reduce((sum,n)=>sum+n,0);
  assert.equal(answer,'x = '+result+'°');
  assert.ok(result>=35&&result<=150);
  const diagram=pointAngles(p);
  assert.equal(diagram.angles.reduce((sum,n)=>sum+n,0),360);
  assert.equal(diagram.angles[diagram.hidden],result);
  const svg=pointAngleSvg(p);
  assert.equal((svg.match(/<line /g)??[]).length,4);
  assert.equal((svg.match(/<path /g)??[]).length,4);
  assert.ok(svg.includes('aria-label='));
  return;
 }
 throw Error('Unsupported real independent oracle '+p.kind);
}
test('R100: independently parse and solve 2,400 real algebra and geometry question texts',()=>{
 let total=0;
 for(const mode of FOCUS_MODES)for(const level of FOCUS_LEVELS)
  for(const seed of [0,1,2,20261108,20261109,314159,987654321,4294967295]){
   const set=makeFocusPack(seed,20,mode,level);
   assert.deepEqual(set,makeFocusPack(seed,20,mode,level),'Reproducible seeded worksheet');
   assert.equal(new Set(set.problems.map(p=>p.question)).size,20);
   verifyFocusPack(set);
   if(mode==='mixed')assert.deepEqual(new Set(set.problems.map(p=>p.kind)),new Set(['literal','multi-step','simplify']));
   for(const p of set.problems){independent(p);assert.ok(p.steps.length>=2);total++;}
  }
 assert.equal(total,FOCUS_MODES.length*FOCUS_LEVELS.length*8*20);
});
test('R100: forged answers, diagrams, algebra transformations, invalid seeds and modes fail closed',async()=>{
 for(const args of [[-1,8,'mixed','standard'],[4294967296,8,'mixed','standard'],[1,5,'mixed','standard'],[1,40,'mixed','standard'],[1,8,'nope','standard'],[1,8,'mixed','expert'],[1.2,8,'mixed','standard']])
  assert.throws(()=>makeFocusPack(...args));
 const sets=[makeFocusPack(20261108,8,'mixed'),makeFocusPack(20261108,8,'point-angles')];
 for(const original of sets){
  for(const change of [
   p=>{p.problems[0].answer='x = 999'},
   p=>{p.problems[0].question='Made-up calculation'},
   p=>{p.problems[0].steps[0]='Invalid shortcut'},
   p=>{p.problems[0].values.a=999999},
   p=>{p.problems[1].id='Q99'},
   p=>{p.problems[2].question=p.problems[0].question},
   p=>{p.problems[0].kind='arbitrary-topic'}
  ]){
   const copy=structuredClone(original);change(copy);
   assert.throws(()=>verifyFocusPack(copy));
   await assert.rejects(createFocusPdf(copy,'questions','A4'));
  }
 }
});
test('R100: 24 real PDF variants (A4/Letter, student/key/steps, all four skills) preserve set IDs',async()=>{
 for(const mode of ['literal','multi-step','simplify','point-angles']){
  const set=makeFocusPack(314159,12,mode,'challenge');
  for(const paper of ['A4','Letter'])for(const edition of ['questions','answers','steps']){
   const bytes=await createFocusPdf(set,edition,paper),pdf=await PDFDocument.load(bytes);
   assert.ok(bytes.length>3500);assert.ok(pdf.getPageCount()>=2);
   for(const page of pdf.getPages()){
    assert.ok(Math.abs(page.getWidth()-(paper==='A4'?595.28:612))<.1);
    assert.ok(Math.abs(page.getHeight()-(paper==='A4'?841.89:792))<.1);
   }
   assert.ok(pdf.getTitle().includes('FD1-314159-'+mode+'-challenge-12'));
   assert.ok(pdf.getTitle().includes(edition));
  }
 }
 await assert.rejects(createFocusPdf(makeFocusPack(1,8),'hacked','A4'));
 await assert.rejects(createFocusPdf(makeFocusPack(1,8),'questions','Huge'));
});
test('R100: only the 6 specific historical HOLD keyword statuses become narrow on-page implementation claims',()=>{
 const matrix=readFileSync(new URL('../R98-KEYWORD-TRUTH-MATRIX.md',import.meta.url),'utf8');
 const expected=['angles around a point worksheet grade 8','literal equations worksheet',
  'algebraic expressions simplify worksheets','multi step equations worksheet',
  'solving multi step equations worksheet','simplifying algebraic expressions worksheet'];
 const count=matrix.split('\n').filter(s=>s.startsWith('| ')&&s.includes('R100 preview-only'));
 assert.equal(count.length,6);
 for(const word of expected){
  const row=matrix.split('\n').find(s=>s.startsWith('| '+word+' |'));
  assert.ok(row?.includes('SUPPORTED (R100 preview-only)'),'Not implemented with narrow intent '+word);
 }
 for(const slug of ['algebra-general-worksheets','geometry-general-worksheets']){
  const info=routes.find(r=>r.slug===slug);assert.equal(info?.type,'HOLD');
  const page=readFileSync(new URL('../src/pages/'+slug+'/index.astro',import.meta.url),'utf8');
  assert.match(page,/FocusDrills/);assert.match(page,/canonicalPath=/);
 }
 const comp=readFileSync(new URL('../src/components/FocusDrills.astro',import.meta.url),'utf8');
 assert.ok(comp.includes('pointAngleSvg'));assert.ok(comp.includes('data-focus-list'));
 for(const key of ['data-focus-download="questions"','data-focus-download="answers"','data-focus-download="steps"','data-focus-toggle','data-focus-share'])
  assert.ok(comp.includes(key),'Missing control: '+key);
 assert.ok(existsSync(new URL('../src/client/focus-drills.ts',import.meta.url)));
});
