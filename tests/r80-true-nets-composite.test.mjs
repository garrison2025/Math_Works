import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createR80Pack,verifyR80Pack} from '../src/lib/r80-area-nets-pack.ts';
import {createR80Pdf,compositeCrossSection} from '../src/lib/r80-area-nets-pdf.ts';
import {releasePaths} from '../src/lib/indexation.ts';
import old from '../src/data/seo-intent-review.json' with {type:'json'};
import r63 from '../src/data/seo-intent-r63.json' with {type:'json'};
import cap from '../src/data/seo-r80-nets-composite-capability.json' with {type:'json'};
import routes from '../src/data/routes.json' with {type:'json'};
const modes=[
 ['nets','mixed'],['nets','rectangular-prism'],['nets','triangular-prism'],
 ['nets','cylinder'],['nets','square-pyramid'],['nets','regular-tetrahedron'],
 ['composite','mixed'],['composite','left-step'],['composite','right-step']
];
const area=(poly)=>Math.abs(poly.reduce((s,p,i)=>{
 const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1];
},0))/2;
const perimeter=(poly)=>poly.reduce((s,p,i)=>{
 const q=poly[(i+1)%poly.length];return s+Math.hypot(p[0]-q[0],p[1]-q[1]);
},0);
test('R80 5,400 independent net and composite area oracles and exact shape composition',()=>{
 let count=0;const kinds=new Set();
 for(const [skill,mode] of modes)for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,17,20261107,4294967295]){
  const p=createR80Pack(seed,40,difficulty,skill,mode);
  assert.deepEqual(p,createR80Pack(seed,40,difficulty,skill,mode));
  verifyR80Pack(p);
  assert.equal(new Set(p.problems.map(q=>q.question)).size,40);
  const has=new Set(p.problems.map(q=>q.kind));
  if(skill==='nets'&&mode==='mixed')assert.equal(has.size,5);
  if(skill==='composite'&&mode==='mixed')
   assert.deepEqual(new Set(p.problems.map(q=>q.orientation)),new Set(['left','right']));
  for(const q of p.problems){
   kinds.add(q.kind);let expected='';
   if(q.kind==='rectangular-prism')expected=2*(q.l*q.w+q.l*q.h+q.w*q.h)+' '+q.unit+'²';
   else if(q.kind==='triangular-prism'){
    assert.equal(q.a*q.a+q.b*q.b,q.c*q.c);
    expected=q.a*q.b+(q.a+q.b+q.c)*q.length+' '+q.unit+'²';
   }else if(q.kind==='cylinder')expected=(2*q.radius*q.radius+2*q.radius*q.height)+'π '+q.unit+'²';
   else if(q.kind==='square-pyramid')expected=q.side*q.side+2*q.side*q.slant+' '+q.unit+'²';
   else if(q.kind==='regular-tetrahedron'){
    const h=q.side*Math.sqrt(3)/2;
    assert.ok(Math.abs(4*q.side*h/2-q.side*q.side*Math.sqrt(3))<1e-9);
    expected=q.side*q.side+'√3 '+q.unit+'²';
   }else{
    const {baseLength:B,stepLength:T,depth:D,lowHeight:H,upperHeight:J}=q;
    const lower=2*(B*D+B*H+D*H),upper=2*(T*D+T*J+D*J);
    const exposed=lower+upper-2*T*D;
    assert.equal(exposed,2*(B*H+T*J)+2*D*(B+H+J));
    const polygon=compositeCrossSection(q);
    assert.equal(area(polygon),B*H+T*J);
    assert.ok(Math.abs(perimeter(polygon)-2*(B+H+J))<1e-8);
    expected=exposed+' '+q.unit+'²';
   }
   assert.equal(q.answer,expected);
   assert.equal(q.steps.length,3);
   assert.ok(q.question.includes('surface area')||q.question.includes('TOTAL area'));
   count++;
  }
 }
 assert.equal(count,5400);
 assert.equal(kinds.size,6);
});
test('R80 54 original A4/Letter actual net and joined-composite PDFs',async()=>{
 let outputs=0;
 for(const [skill,mode] of modes)for(const paper of ['A4','Letter'])
 for(const edition of ['questions','answers','steps']){
  const p=createR80Pack(20261107,8,'standard',skill,mode);
  const file=await PDFDocument.load(await createR80Pdf(p,edition,paper,'extra'));
  assert.equal(file.getPageCount(),3);
  assert.equal(Math.round(file.getPage(0).getWidth()),paper==='A4'?595:612);
  assert.equal(Math.round(file.getPage(0).getHeight()),paper==='A4'?842:792);
  assert.match(file.getTitle()??'',/R80/);
  assert.match(file.getTitle()??'',new RegExp(edition));
  outputs++;
 }
 assert.equal(outputs,54);
});
test('R80 reject forged original geometry, teacher answers, page modes and edited metadata',async()=>{
 for(const [skill,mode] of [['nets','mixed'],['composite','mixed']]){
  const p=createR80Pack(20261107,40,'challenge',skill,mode);
  const pdf=await PDFDocument.load(await createR80Pdf(p,'steps','Letter'));
  assert.equal(pdf.getPageCount(),14);
  for(const key of ['answer','question','steps','l','baseLength','stepLength','orientation']){
   const edited=structuredClone(p);
   if(key==='answer'||key==='question')edited.problems[0][key]='invalid';
   else if(key==='steps')edited.problems[0].steps[1]='invalid';
   else if(key==='orientation')edited.problems[0].orientation='invalid';
   else edited.problems[0][key]+=1;
   assert.throws(()=>verifyR80Pack(edited));
   await assert.rejects(()=>createR80Pdf(edited,'answers','A4'));
  }
 }
 assert.throws(()=>createR80Pack(-1,8),/seed/);
 assert.throws(()=>createR80Pack(5,41),/1-40/);
 assert.throws(()=>createR80Pack(5,8,'standard','composite','cylinder'),/composite/);
 await assert.rejects(()=>createR80Pdf(createR80Pack(5,8),'invalid','A4'));
});
test('R80 original 488 SEO source rows and original v18 generators are untouched',()=>{
 const lines=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8').split(/\r?\n/);
 assert.equal(lines.filter(x=>x.startsWith('`')).length,488);
 assert.equal(cap.keywordCapabilityUpdates.length,2);
 const flags=[...old.flagged,...r63.issues];
 for(const entry of cap.keywordCapabilityUpdates){
  const line=lines.find(s=>s.startsWith('`'+entry.keyword+'`,'));
  assert.ok(line,'Original owner keyword missing: '+entry.keyword);
  assert.equal(Number(line.split(',')[1]),entry.sourceMonthlyVolume);
  assert.equal(Number(line.split(',')[2]),entry.sourceKD);
  assert.ok(flags.some(f=>f.keyword===entry.keyword&&f.classification==='unsupported'),
   'Only actual historically unsupported terms can count as implemented');
 }
 const before=makeWorksheet('surface-area-worksheets',20261107,8,'standard');
 createR80Pack(20261107,8,'standard','nets');
 createR80Pack(20261107,8,'standard','composite');
 assert.deepEqual(makeWorksheet('surface-area-worksheets',20261107,8,'standard'),before);
 assert.equal(before.generatorVersion,'18');
 assert.equal(routes.length,55);
 assert.equal(cap.approvedForIndexing,false);
 assert.deepEqual(releasePaths({site:'https://math-works.pages.dev',enabled:'true',
  routes:routes.map(r=>r.slug).join(','),branch:'main'},routes),[]);
});
