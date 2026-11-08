/** R101 mathematically independent verification, real PDFs and truthful 488-row SEO scope. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {makeWidePack,verifyWidePack,wideDiagram,WIDE_MODES,WIDE_LEVELS,WIDE_COUNTS,MODE_LABELS} from '../src/lib/r101-comprehensive.ts';
import {createWidePdf,wideDiagramHeight} from '../src/lib/r101-comprehensive-pdf.ts';
const routeData=JSON.parse(readFileSync(new URL('../src/data/routes.json',import.meta.url),'utf8'));
const gcd=(x,y)=>{while(y){const t=x%y;x=y;y=t;}return x;};
function independentlySolve(p){
 const {a,b,c,d,v}=p.values;
 let expected='';
 switch(p.kind){
 case 'g2-add':expected=String(a+b);break;
 case 'g2-sub':expected=String(a-b);break;
 case 'g2-place':expected=String(v===0?Math.trunc(a/100):v===1?Math.trunc(a/10)%10:a%10);break;
 case 'g2-time':{
  const time=60*a+b+c;expected=Math.trunc(time/60)+':'+String(time%60).padStart(2,'0')+' a.m.';break;
 }
 case 'g2-money':expected=a+b+' cents';break;
 case 'g2-shape':case 'real-shape':{
  expected=['circle','rectangle','octagon','sphere','cylinder','cube'][v];break;
 }
 case 'g5-mult':expected=String(a*b);break;
 case 'g5-div':expected=String(a);assert.match(p.question,new RegExp(String(a*b)+' ÷ '+b));break;
 case 'g5-decimal':expected=((v===0?a+b:a-b)/100).toFixed(2);break;
 case 'g5-fraction':{
  const num=a*d+c*b,den=b*d,g=gcd(num,den);
  expected=den/g===1?String(num/g):(num/g)+'/'+(den/g);break;
 }
 case 'g5-volume':case 'vol-prism':expected=a*b*c+' cm³';break;
 case 'g5-order':expected=String(a*(b+c)+d);break;
 case 'g5-measure':expected=a*(v===0?100:1000)+' '+(v===0?'centimetres':'millilitres');break;
 case 'g5-story':expected=a*b-c+' stickers';break;
 case 'polygon-sides':{
  const labels=['triangle','quadrilateral','pentagon','hexagon','heptagon','octagon','nonagon','decagon','hendecagon','dodecagon'];
  expected=v===1?labels[a-3]:String(a);
  assert.ok(p.question.includes(v===1?String(a):labels[a-3]));break;
 }
 case 'triangle-congruence':{
  expected='Congruent by '+['SSS','SAS','ASA','AAS','HL'][v];
  if(v===0)assert.ok(c>Math.abs(a-b)&&c<a+b,'SSS must form a triangle');
  if(v===2||v===3)assert.ok(a+b<180);
  if(v===4)assert.ok(a>b);
  break;
 }
 case 'triangle-similarity':{
  const legs=a===0?[3,4,5]:[5,12,13];
  if(v===0)expected=String(legs[1]*b*c);
  else if(v===1)expected=String(legs[2]*b*c);
  else expected=String(c);
  assert.ok(p.question.includes('AB='+(legs[0]*b)));
  assert.ok(p.question.includes('DE='+(legs[0]*b*c)));
  break;
 }
 case 'tri-angle':expected=180-a-b+'°';break;
 case 'tri-area':expected=a*b+' cm²';break;
 case 'circle-radius':expected=a+' cm';break;
 case 'circle-circumference':expected=2*a+'π cm';break;
 case 'circle-area':expected=a*a+'π cm²';break;
 case 'circle-semicircle':expected=a+'π + '+2*a+' cm';break;
 case 'vol-cylinder':expected=a*a*b+'π cm³';break;
 case 'vol-cone':expected=a*a*b+'π cm³';assert.ok(p.question.includes(String(3*b)));break;
 case 'vol-sphere':expected=36*a*a*a+'π cm³';break;
 case 'vol-pyramid':expected=a*a*b+' cm³';break;
 case 'vol-tri-pyramid':expected=a*b*c+' cm³';assert.ok(p.question.includes('solid perpendicular height'));break;
 case 'eq-one-step':expected=b+' stickers';assert.ok(p.question.includes(String(a+b)));break;
 case 'eq-two-step':expected=c+' dollars';assert.ok(p.question.includes(String(a*c+b)));break;
 case 'eq-multi':expected=d+' pencils';assert.ok(p.question.includes(String(a*(d+b)-c)));break;
 default:assert.fail('Missing independent oracle for '+p.kind);
 }
 assert.equal(p.answer,expected,'Mathematics mismatch '+p.kind+' | '+p.question);
 assert.ok(p.question.length>=10,'Empty question for '+p.kind);
 assert.ok(p.steps.length>=2,'Missing actual two-step work for '+p.kind);
 for(const step of p.steps)assert.ok(step.length>=10,'Trivial/incomplete worked step');
 const svg=wideDiagram(p);
 if(wideDiagramHeight(p)){
  if(p.kind==='triangle-similarity'||(p.kind==='triangle-congruence'&&p.values.v===4))
   assert.match(svg,/data-right-angle="true"/,'Right-angle proof diagram must visibly have 90-degree corners');
  if(p.kind==='circle-semicircle')assert.ok(svg.includes('<path d="M 91 56 A 39 39'),'Semicircle must not be drawn as a full circle');
  assert.match(svg,/^<svg /);
  assert.match(svg,/<\/svg>$/);
  assert.ok(!svg.includes('<script'));
  assert.ok(svg.includes('role="img"'));
 }else assert.equal(svg,'');
}
test('R101: 11 modes across 3 levels, 5 seeds and 24 questions are reproducible and mathematically consistent',()=>{
 let n=0;
 for(const mode of WIDE_MODES.filter(mode=>mode!=='grade5-full'))for(const level of WIDE_LEVELS)
  for(const seed of [0,1,2,20261108,4294967295]){
   const pack=makeWidePack(seed,24,mode,level);
   assert.equal(pack.problems.length,24);
   assert.deepEqual(pack,makeWidePack(seed,24,mode,level),'Seeded packs must be reproducible');
   verifyWidePack(pack);
   assert.equal(new Set(pack.problems.map(p=>p.question)).size,24,'No duplicates allowed');
   for(const problem of pack.problems){independentlySolve(problem);n++;}
   if(mode==='grade5')assert.equal(new Set(pack.problems.slice(0,8).map(p=>p.kind)).size,8);
   if(mode==='grade2')assert.equal(new Set(pack.problems.slice(0,6).map(p=>p.kind)).size,6);
  }
 assert.equal(n,(WIDE_MODES.length-1)*WIDE_LEVELS.length*5*24);
 assert.equal(WIDE_COUNTS.length,3);
 assert.equal(Object.keys(MODE_LABELS).length,WIDE_MODES.length);
});
test('R101: untrusted forged question, answer, step, geometry value, order and settings fail closed',async()=>{
 for(const [seed,count,mode,level] of [
  [-1,8,'grade2','standard'],[4294967296,8,'grade5','standard'],[1,10,'grade2','easy'],
  [1,0,'grade5','easy'],[1,8,'unverified','easy'],[1,8,'grade5','super'],[1.1,8,'grade5','standard']
 ])assert.throws(()=>makeWidePack(seed,count,mode,level));
 for(const mode of ['grade2','grade5','congruent','similar','shapes','volumes','equation-stories']){
  const pack=makeWidePack(20261108,8,mode);
  for(const mutate of [
   p=>{p.problems[0].question='Unrelated geometry';},
   p=>{p.problems[0].answer='Not the correct answer';},
   p=>{p.problems[0].steps[0]='Fake reasoning';},
   p=>{p.problems[0].values.a=1000001;},
   p=>{p.problems[1].id='Q88';},
   p=>{p.problems[1].question=p.problems[0].question;},
   p=>{p.problems[0].kind='unknown';}
  ]){
   const fake=structuredClone(pack);mutate(fake);
   assert.throws(()=>verifyWidePack(fake));
   await assert.rejects(createWidePdf(fake,'questions','Letter'));
  }
 }
});
test('R101: 66 real PDFs, separate student/teacher/worked documents in both paper formats',async()=>{
 let files=0;
 for(const mode of WIDE_MODES.filter(mode=>mode!=='grade5-full')){
  const pack=makeWidePack(314159,16,mode,'challenge');
  for(const paper of ['A4','Letter'])for(const edition of ['questions','answers','steps']){
   const bytes=await createWidePdf(pack,edition,paper),pdf=await PDFDocument.load(bytes);
   assert.ok(bytes.byteLength>2800);
   assert.ok(pdf.getPageCount()>0);
   const pages=pdf.getPages();
   for(const pg of pages){
    assert.ok(Math.abs(pg.getWidth()-(paper==='A4'?595.28:612))<.1);
    assert.ok(Math.abs(pg.getHeight()-(paper==='A4'?841.89:792))<.1);
   }
   assert.ok(pdf.getTitle().includes('WM1-314159-'+mode+'-challenge-16'));
   assert.ok(pdf.getTitle().includes(edition));
   files++;
  }
 }
 assert.equal(files,66);
 await assert.rejects(createWidePdf(makeWidePack(42),'hacked','A4'));
 await assert.rejects(createWidePdf(makeWidePack(42),'questions','A3'));
});
test('R101: frozen original 488 source rows, 51 active generators, four HOLDs and noindex must be unchanged',()=>{
 const source=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8').trim().split(/\r?\n/);
 assert.equal(source.length,489,'Frozen 488 original keyword rows plus header');
 const held=routeData.filter(r=>r.type==='HOLD').map(r=>r.slug).sort();
 assert.deepEqual(held,['algebra-general-worksheets','geometry-general-worksheets','word-problems-worksheets','worksheets-by-grade']);
 assert.equal(routeData.filter(r=>r.type!=='HOLD').length,51);
 for(const [route,scope] of [
  ['worksheets-by-grade','grade'],['geometry-general-worksheets','geometry'],['word-problems-worksheets','stories']
 ]){
  const page=readFileSync(new URL('../src/pages/'+route+'/index.astro',import.meta.url),'utf8');
  assert.ok(page.includes('<R101Comprehensive scope="'+scope+'"/>'),'Preview lab missing at '+route);
 }
 const comp=readFileSync(new URL('../src/components/R101Comprehensive.astro',import.meta.url),'utf8');
 const client=readFileSync(new URL('../src/client/r101-comprehensive.ts',import.meta.url),'utf8');
 for(const name of ['questions','answers','steps'])assert.ok(comp.includes('data-wide-download="'+name+'"'));
 assert.ok(client.includes('navigator.clipboard.writeText'));
 const layout=readFileSync(new URL('../src/components/Layout.astro',import.meta.url),'utf8');
 assert.ok(layout.includes('noindex,nofollow'));
 assert.ok(layout.includes('const canonical=indexed?'));
 const matrix=readFileSync(new URL('../R98-KEYWORD-TRUTH-MATRIX.md',import.meta.url),'utf8');
 const expected=[
  'free printable 2nd grade math worksheets',
  'real life examples of geometric shapes printable free',
  'congruent triangles worksheet',
  'similar triangles worksheet',
  'triangle congruence worksheet',
  'full worksheet of all of grade 5 math',
  'equation story problems','shapes and sides','volume practice problems','circle worksheet','triangle worksheet','shapes worksheet'
 ];
 assert.equal(expected.length,12);
 for(const phrase of expected){
  const row=matrix.split('\n').find(s=>s.startsWith('| '+phrase+' |'));
  assert.ok(row?.includes(phrase==='full worksheet of all of grade 5 math'?'R102 preview-only':'R101 preview-only'),'Scope matrix not updated for '+phrase);
 }
 const partial=matrix.split('\n').filter(x=>x.startsWith('| ')&&x.includes('**PARTIAL'));
 assert.equal(partial.length,0,'Every old partial phrase must have a bounded honest implemented scope');
});
