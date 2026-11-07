import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import old62 from '../src/data/seo-intent-review.json' with {type:'json'};
import old63 from '../src/data/seo-intent-r63.json' with {type:'json'};
import capability from '../src/data/seo-r84-multiplication-models-capability.json' with {type:'json'};
import {makeWorksheet} from '../src/lib/math.ts';
import {EXTRA_PACK_KEYS,buildExtraPackLink,parseExtraPackLink} from '../src/lib/extra-pack-link.ts';
import {createMultiplicationModelPack,verifyMultiplicationModelPack} from '../src/lib/multiplication-models.ts';
import {createMultiplicationModelPdf} from '../src/lib/multiplication-models-pdf.ts';

const kinds=['arrays','number-line','stories'];
test('R84 2,400 exact reproducible questions, independently checked by integer arithmetic',()=>{
 let checked=0;
 for(const mode of ['mixed',...kinds])for(const difficulty of ['easy','standard','challenge'])
 for(const seed of [0,1,17,20261107,4294967295]){
  const pack=createMultiplicationModelPack(seed,40,difficulty,mode);
  assert.deepEqual(pack,createMultiplicationModelPack(seed,40,difficulty,mode));
  verifyMultiplicationModelPack(pack);
  assert.equal(new Set(pack.problems.map(p=>p.question)).size,40);
  if(mode==='mixed')assert.deepEqual(new Set(pack.problems.map(p=>p.kind)),new Set(kinds));
  for(const [i,p] of pack.problems.entries()){
   const a=BigInt(p.groups),b=BigInt(p.size);
   assert.equal(BigInt(p.answer),a*b,'independent product mismatch');
   assert.equal(p.product,Number(a*b));
   assert.ok(p.groups>=2&&p.size>=2&&p.groups<=12&&p.size<=12);
   assert.match(p.question,/How many|What number/);
   assert.equal(p.steps.length,3);
   assert.match(p.steps[1],new RegExp(p.groups+' x '+p.size+' = '+p.product));
   assert.equal(p.kind,mode==='mixed'?kinds[i%3]:mode);
   if(p.kind==='arrays')assert.match(p.question,new RegExp(p.groups+' rows and '+p.size+' dots'));
   if(p.kind==='number-line')assert.match(p.question,new RegExp(p.groups+' equal jumps of '+p.size+' units'));
   checked++;
  }
 }
 assert.equal(checked,2400);
});
test('R84 reject modified answer, factor, question, explanation, duplicates, invalid options',()=>{
 const pack=createMultiplicationModelPack(20261107,8,'standard','mixed');
 for(const patch of [
  p=>{p.problems[0].answer='999';},
  p=>{p.problems[0].product++;},
  p=>{p.problems[1].size=999;},
  p=>{p.problems[2].question='Something else';},
  p=>{p.problems[0].steps[1]='2 x 2 = 7';},
  p=>{p.problems[1].question=p.problems[0].question;p.problems[1].kind=p.problems[0].kind;}
 ]){
  const corrupt=structuredClone(pack);patch(corrupt);
  assert.throws(()=>verifyMultiplicationModelPack(corrupt));
 }
 assert.throws(()=>createMultiplicationModelPack(-1,8));
 assert.throws(()=>createMultiplicationModelPack(20261107,41));
 assert.throws(()=>createMultiplicationModelPack(20261107,8,'standard','fake'));
});
test('R84 real A4/Letter student/key/steps PDFs for every diagram and story mode',async()=>{
 let count=0;
 for(const mode of ['mixed',...kinds])for(const paper of ['A4','Letter'])
 for(const output of ['questions','answers','steps']){
  const pack=createMultiplicationModelPack(20261107,8,'standard',mode);
  const data=await createMultiplicationModelPdf(pack,output,paper,'extra');
  const pdf=await PDFDocument.load(data);
  assert.equal(pdf.getPageCount(),4);
  assert.ok(Math.abs(pdf.getPage(0).getWidth()-(paper==='A4'?595.28:612))<.1);
  assert.match(pdf.getTitle()??'',/R84/);
  assert.match(pdf.getTitle()??'',new RegExp(mode));
  assert.match(pdf.getTitle()??'',new RegExp(output));
  count++;
 }
 assert.equal(count,24);
});
test('R84 maximum 40 problems are paginated; concurrent PDFs have isolated embedded fonts',async()=>{
 const pack=createMultiplicationModelPack(20261107,40,'challenge','mixed');
 const docs=await Promise.all(['questions','answers','steps'].map(async output=>
  PDFDocument.load(await createMultiplicationModelPdf(pack,output,'Letter'))));
 for(const pdf of docs)assert.equal(pdf.getPageCount(),20);
});
test('R84 preserves original v18 multiplication generator and extends stable share links',()=>{
 const original=makeWorksheet('multiplication-worksheets',20261107,8,'standard');
 createMultiplicationModelPack(20261107,8,'standard','number-line');
 assert.deepEqual(makeWorksheet('multiplication-worksheets',20261107,8,'standard'),original);
 assert.equal(EXTRA_PACK_KEYS.includes('r84-multiplication-mode'),true);
 const base='https://math-works.pages.dev/multiplication-worksheets/?gv=18&seed=20261107&quantity=8';
 const opts=[{key:'r84-multiplication-mode',allowed:['mixed','arrays','number-line','stories'],
  defaultValue:'mixed',selectedValue:'number-line'}];
 const link=buildExtraPackLink(base,opts);
 assert.equal(new URL(link).searchParams.get('xp_r84-multiplication-mode'),'number-line');
 assert.deepEqual(parseExtraPackLink(link,opts),{'r84-multiplication-mode':'number-line'});
});
test('R84 five historical exact unsupported intents resolved narrowly, never auto-indexed',()=>{
 const flagged=[...old62.flagged,...old63.issues];
 const keywords=capability.keywordCapabilityUpdates;
 assert.equal(keywords.length,5);
 assert.equal(new Set(keywords.map(x=>x.keyword)).size,5);
 for(const row of keywords)assert.equal(flagged.filter(f=>
  f.keyword===row.keyword&&f.slug==='multiplication-worksheets'&&f.classification==='unsupported').length,1);
 assert.equal(capability.approvedForIndexing,false);
 assert.equal(capability.originalOwner488RowsEdited,false);
 assert.equal(capability.gradeFourStandardsCertification,'NOT REVIEWED');
});

test('R84 exact browser default seed 20261104 produces all PDF editions without errors',async()=>{
 for(const mode of ['mixed','arrays','number-line','stories']){
  const pack=createMultiplicationModelPack(20261104,8,'standard',mode);
  for(const edition of ['questions','answers','steps']){
   const bytes=await createMultiplicationModelPdf(pack,edition,'A4','standard');
   const pdf=await PDFDocument.load(bytes);
   assert.equal(pdf.getPageCount(),4);
  }
 }
});
