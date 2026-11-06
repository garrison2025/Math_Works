import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createSolidPack,verifySolidPack} from '../src/lib/prism-pyramid-pack.ts';
import {createSolidPdf} from '../src/lib/prism-pyramid-pdf.ts';
import {releasePaths} from '../src/lib/indexation.ts';
import routes from '../src/data/routes.json' with {type:'json'};
import capability from '../src/data/seo-r78-solids-capability.json' with {type:'json'};
import previous from '../src/data/seo-intent-review.json' with {type:'json'};
import r63 from '../src/data/seo-intent-r63.json' with {type:'json'};
const modes=[
 ['volume-of-rectangular-prisms-worksheets','mixed'],
 ['volume-of-rectangular-prisms-worksheets','triangular-prism-volume'],
 ['surface-area-worksheets','mixed'],
 ['surface-area-worksheets','triangular-prism-surface'],
 ['surface-area-worksheets','square-pyramid-surface'],
 ['surface-area-worksheets','regular-tetrahedron-surface']
];
test('R78: 3,600 seeded exact prism/pyramid oracles independently compute true face areas',()=>{
 let count=0;const samples=new Set();
 for(const [topic,mode] of modes)for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,17,20261106,4294967295]){
  const p=createSolidPack(topic,seed,40,difficulty,mode);
  assert.deepEqual(p,createSolidPack(topic,seed,40,difficulty,mode));
  verifySolidPack(p);assert.equal(new Set(p.problems.map(x=>x.question)).size,40);
  for(const q of p.problems){
   samples.add(q.kind);
   if(q.kind.startsWith('triangular-prism')){
    const {a,b,c,length:L}=q;
    assert.equal(a*a+b*b,c*c,'genuine integer right triangle');
    const base=a*b/2;
    assert.ok(Number.isInteger(base));
    assert.equal(q.answer,q.kind==='triangular-prism-volume'
     ?String(base*L)+' '+q.unit+'³'
     :String(2*base+(a+b+c)*L)+' '+q.unit+'²');
    assert.equal(q.side,0);assert.equal(q.slant,0);
   }else if(q.kind==='square-pyramid-surface'){
    const {side:s,slant:l}=q;
    assert.ok(l>s/2,'slant height must allow a real right square pyramid');
    // Two perpendicular opposing pairs of triangular faces.
    const face=.5*s*l;
    assert.equal(q.answer,String(s*s+4*face)+' '+q.unit+'²');
   }else{
    assert.equal(q.kind,'regular-tetrahedron-surface');
    // Independent equilateral triangle altitude h = sqrt(3)/2 * side.
    const s=q.side,h=s*Math.sqrt(3)/2;
    assert.ok(Math.abs(4*(s*h/2)-s*s*Math.sqrt(3))<1e-9);
    assert.equal(q.answer,s*s+'√3 '+q.unit+'²');
    assert.match(q.question,/REGULAR/);
   }
   assert.equal(q.steps.length,3);
   count++;
  }
 }
 assert.equal(count,3600);
 assert.deepEqual([...samples].sort(),[
  'regular-tetrahedron-surface','square-pyramid-surface',
  'triangular-prism-surface','triangular-prism-volume'
 ]);
});
test('R78: 36 genuine Letter/A4 PDF exports and 3 different student/teacher/steps editions',async()=>{
 let files=0;
 for(const [topic,mode] of modes)for(const paper of ['Letter','A4'])
 for(const output of ['questions','answers','steps']){
  const p=createSolidPack(topic,20261106,8,'standard',mode);
  const bytes=await createSolidPdf(p,output,paper,'extra');
  const pdf=await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(),3);
  assert.equal(Math.round(pdf.getPage(0).getWidth()),paper==='A4'?595:612);
  assert.equal(Math.round(pdf.getPage(0).getHeight()),paper==='A4'?842:792);
  assert.match(pdf.getTitle()??'',/R78\.1/);
  assert.match(pdf.getTitle()??'',new RegExp(output));
  files++;
 }
 assert.equal(files,36);
});
test('R78: 40-question max count and edited geometry/answer/steps fail closed',async()=>{
 for(const topic of ['volume-of-rectangular-prisms-worksheets','surface-area-worksheets']){
  const p=createSolidPack(topic,20261106,40,'challenge');
  const pdf=await PDFDocument.load(await createSolidPdf(p,'steps','Letter'));
  assert.equal(pdf.getPageCount(),14);
  for(const field of ['a','b','c','length','side','slant','answer','question','steps']){
   const wrong=structuredClone(p);
   if(field==='answer'||field==='question')wrong.problems[0][field]='incorrect';
   else if(field==='steps')wrong.problems[0].steps[0]='wrong formula';
   else wrong.problems[0][field]++;
   assert.throws(()=>verifySolidPack(wrong));
   await assert.rejects(()=>createSolidPdf(wrong,'answers','A4'));
  }
 }
 assert.throws(()=>createSolidPack('surface-area-worksheets',-1,8),/seed/);
 assert.throws(()=>createSolidPack('surface-area-worksheets',20261106,41),/1-40/);
 assert.throws(()=>createSolidPack('volume-of-rectangular-prisms-worksheets',20261106,8,'standard','square-pyramid-surface'),/volume page/);
 await assert.rejects(()=>createSolidPdf(
  createSolidPack('surface-area-worksheets',20261106,8),'invalid','Letter'));
});
test('R78: only owner-original exact unsupported keyword issues are counted, not all pyramids or nets',()=>{
 const csv=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8').split(/\r?\n/);
 assert.equal(csv.length-2,488);
 const old=[...previous.flagged,...r63.issues];
 assert.equal(capability.keywordCapabilityUpdates.length,5);
 for(const item of capability.keywordCapabilityUpdates){
  const match=csv.find(line=>line.startsWith('`'+item.keyword+'`,'));
  assert.ok(match,'Not in owner source '+item.keyword);
  assert.equal(Number(match.split(',')[1]),item.sourceMonthlyVolume);
  assert.equal(Number(match.split(',')[2]),item.sourceKD);
  assert.ok(old.some(s=>s.keyword===item.keyword&&s.classification==='unsupported'),
   'Historical unsupported problem required');
 }
 assert.ok(!capability.keywordCapabilityUpdates.some(item=>item.keyword==='surface area of triangular pyramid worksheet'));
 const beforeSA=makeWorksheet('surface-area-worksheets',20261106,8,'standard');
 const beforeV=makeWorksheet('volume-of-rectangular-prisms-worksheets',20261106,8,'standard');
 createSolidPack('surface-area-worksheets',20261106,8);
 createSolidPack('volume-of-rectangular-prisms-worksheets',20261106,8);
 assert.deepEqual(makeWorksheet('surface-area-worksheets',20261106,8,'standard'),beforeSA);
 assert.deepEqual(makeWorksheet('volume-of-rectangular-prisms-worksheets',20261106,8,'standard'),beforeV);
 assert.equal(beforeSA.generatorVersion,'18');
 assert.equal(beforeV.generatorVersion,'18');
 assert.equal(routes.length,55);
 assert.deepEqual(releasePaths({site:'https://math-works.pages.dev',enabled:'true',
  routes:routes.map(r=>r.slug).join(','),branch:'main'},routes),[]);
});
