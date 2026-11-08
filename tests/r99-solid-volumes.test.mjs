import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {makeSolidSet,verifySolidSet,exactSolidCoefficient,formatSolidVolume,
 SOLID_KINDS,SOLID_MODES,SOLID_LEVELS} from '../src/lib/solid-volumes.ts';
import {createSolidPdf} from '../src/lib/solid-volumes-pdf.ts';
import {createStoryPdf,STORY_FOOTER_BASELINE} from '../src/lib/word-problems-pdf.ts';
import {makeStorySet} from '../src/lib/word-problems.ts';
import routes from '../src/data/routes.json' with {type:'json'};
function normalized(n,d){n=BigInt(n);d=BigInt(d);let a=n,b=d;while(b){const t=a%b;a=b;b=t}return [n/a,d/a]}
function independent(p){
 const text=p.question;let match,n,d,pi;
 if(p.kind==='sphere'){
  match=text.match(/sphere has radius (\d+) (cm|m|ft)/);assert.ok(match,text);
  n=4n*BigInt(match[1])**3n;d=3n;pi=true;
 }else if(p.kind==='cone'){
  match=text.match(/cone has radius (\d+) (cm|m|ft) and perpendicular height (\d+) (cm|m|ft)/);
  assert.ok(match,text);assert.equal(match[2],match[4]);
  n=BigInt(match[1])**2n*BigInt(match[3]);d=3n;pi=true;
 }else if(p.kind==='square-pyramid'){
  match=text.match(/square base side (\d+) (cm|m|ft) and perpendicular height (\d+) (cm|m|ft)/);
  assert.ok(match,text);assert.equal(match[2],match[4]);
  n=BigInt(match[1])**2n*BigInt(match[3]);d=3n;pi=false;
 }else{
  match=text.match(/triangular base of length (\d+) (cm|m|ft) and triangle altitude (\d+) (cm|m|ft).*height is (\d+) (cm|m|ft)/);
  assert.ok(match,text);assert.equal(match[2],match[4]);assert.equal(match[2],match[6]);
  n=BigInt(match[1])*BigInt(match[3])*BigInt(match[5]);d=6n;pi=false;
 }
 const [num,den]=normalized(n,d),body=pi?(num===1n?'π':num+'π'):String(num);
 return body+(den===1n?'':'/'+den)+' cubic '+match[2];
}
test('R99: independently parse actual question text and recalculate exact rational volumes for 2,400 seeded problems',()=>{
 let cases=0;
 for(const mode of SOLID_MODES)for(const level of SOLID_LEVELS)for(const seed of [0,1,2,20261104,20261108,314159,4294967295,987654321]){
  const a=makeSolidSet(seed,20,mode,level),b=makeSolidSet(seed,20,mode,level);
  assert.deepEqual(a,b,'Same seed/options must reproduce exact set');
  verifySolidSet(a);
  assert.equal(new Set(a.problems.map(p=>p.question)).size,20);
  if(mode==='mixed')assert.deepEqual(new Set(a.problems.map(p=>p.kind)),new Set(SOLID_KINDS));
  for(const p of a.problems){
   assert.equal(p.answer,independent(p),'Actual question and answer differ: '+p.question);
   const coefficient=exactSolidCoefficient(p.kind,p.dimensions);
   assert.deepEqual(p.coefficient,{n:coefficient.n,d:coefficient.d});
   assert.equal(p.answer,formatSolidVolume(coefficient.n,coefficient.d,coefficient.hasPi,p.unit));
   assert.equal(p.steps.length,2);assert.ok(p.steps[1].endsWith(p.answer+'.'));
   cases++;
  }
 }
 assert.equal(cases,SOLID_MODES.length*SOLID_LEVELS.length*8*20);
});
test('R99: reject invalid configuration, forged units and tampered mathematics before PDF creation',async()=>{
 for(const options of [[-1,8,'mixed','easy'],[4294967296,8,'mixed','easy'],[1,3,'mixed','easy'],[1,40,'mixed','easy'],[1,8,'unknown','easy'],[1,8,'sphere','bad'],[1.5,8,'sphere','easy']])
  assert.throws(()=>makeSolidSet(...options));
 const set=makeSolidSet(20261108,8);
 const edits=[
  p=>{p.problems[0].answer='999π cubic cm'},
  p=>{p.problems[0].steps[1]='Incorrect algebra'},
  p=>{p.problems[0].coefficient.n+=1},
  p=>{p.problems[0].question='A random fake question'},
  p=>{p.problems[0].dimensions.r=0},
  p=>{p.problems[0].unit='mm'},
  p=>{p.problems[1].id='Q99'},
  p=>{p.problems[2].question=p.problems[0].question}
 ];
 for(const fn of edits){
  const copy=structuredClone(set);fn(copy);assert.throws(()=>verifySolidSet(copy));
  await assert.rejects(createSolidPdf(copy,'questions','Letter'));
 }
});
test('R99: three actual PDF editions, Letter and A4, have matching exact set ID and correct paper dimensions',async()=>{
 for(const unit of ['A4','Letter'])for(const edition of ['questions','answers','steps']){
  const set=makeSolidSet(314159,20,'mixed','challenge'),bytes=await createSolidPdf(set,edition,unit),pdf=await PDFDocument.load(bytes);
  assert.ok(bytes.length>3000);assert.ok(pdf.getPageCount()>=2);
  for(const page of pdf.getPages()){
   assert.ok(Math.abs(page.getWidth()-(unit==='A4'?595.28:612))<.1);
   assert.ok(Math.abs(page.getHeight()-(unit==='A4'?841.89:792))<.1);
  }
  assert.match(pdf.getTitle(),/SV1-314159-mixed-challenge-20/);
  assert.match(pdf.getTitle(),new RegExp(edition));
 }
 await assert.rejects(createSolidPdf(makeSolidSet(1,8),'unreviewed','Letter'));
});
test('R99: actual preview route, noindex safety, accessible controls and live generator integration',()=>{
 const geometry=readFileSync(new URL('../src/pages/geometry-general-worksheets/index.astro',import.meta.url),'utf8');
 assert.match(geometry,/SolidVolumes/);
 const component=readFileSync(new URL('../src/components/SolidVolumes.astro',import.meta.url),'utf8');
 assert.match(component,/data-solid-workspace/);
 for(const label of ['data-solid-download="questions"','data-solid-download="answers"','data-solid-download="steps"','data-solid-toggle','data-solid-share','data-solid-seed','data-solid-mode'])
  assert.ok(component.includes(label),'Missing UI control '+label);
 assert.ok(existsSync(new URL('../src/client/solid-volumes.ts',import.meta.url)));
 assert.equal(routes.find(x=>x.slug==='geometry-general-worksheets')?.type,'HOLD',
  'Supplemental geometry page must not gain public indexing from R99');
 const matrix=readFileSync(new URL('../R98-KEYWORD-TRUTH-MATRIX.md',import.meta.url),'utf8');
 for(const keyword of ['volume of a sphere worksheet','volume of spheres worksheet','volume of a cone worksheet','volume of pyramid worksheet','volume of triangular pyramid worksheet']){
  const row=matrix.split('\n').find(line=>line.startsWith('| '+keyword+' |'));
  assert.ok(row&&row.includes('R99 preview-only'),'Missing exact supported-keyword scope: '+keyword);
 }
});
test('R99: R98 word-problem footer now meets 36pt minimum PDF edge margin after regression repair',async()=>{
 assert.ok(STORY_FOOTER_BASELINE>=36);
 const bytes=await createStoryPdf(makeStorySet(314159,40,'mixed','challenge'),'steps','Letter');
 const doc=await PDFDocument.load(bytes);
 assert.ok(doc.getPageCount()>=4);
});
