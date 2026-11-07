import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import flags62 from '../src/data/seo-intent-review.json' with {type:'json'};
import flags63 from '../src/data/seo-intent-r63.json' with {type:'json'};
import capability from '../src/data/seo-r85-targeted-capability.json' with {type:'json'};
import {makeWorksheet} from '../src/lib/math.ts';
import {EXTRA_PACK_KEYS,buildExtraPackLink,parseExtraPackLink} from '../src/lib/extra-pack-link.ts';
import {createR85Pack,verifyR85Pack,R85_ROUTES,R85_MODES} from '../src/lib/r85-targeted-packs.ts';
import {createR85Pdf} from '../src/lib/r85-targeted-pdf.ts';
const topics=Object.keys(R85_MODES);
test('R85 seeded math: 3 difficulties, all 12 real practice types and 32/40 samples',()=>{
 let exact=0;
 for(const topic of topics)for(const mode of R85_MODES[topic])
 for(const difficulty of ['easy','standard','challenge'])for(const seed of [0,20261104,20261107]){
  const pack=createR85Pack(topic,seed,40,difficulty,mode);
  verifyR85Pack(pack);
  assert.deepEqual(pack,createR85Pack(topic,seed,40,difficulty,mode));
  assert.equal(pack.problems.length,40);
  assert.equal(new Set(pack.problems.map(x=>[x.a,x.b,x.c,x.storyType??''].join('|'))).size,40);
  for(const p of pack.problems){
   assert.equal(p.mode,mode);assert.equal(p.topic,topic);
   assert.match(p.id,/^Q\d+$/);
   assert.equal(p.steps.length,3);
   if(topic==='fractions'&&mode==='pictures'){
    assert.ok(p.b>=1&&p.b<p.a);
    assert.equal(p.answer,p.b+'/'+p.a);
   }
   if(topic==='fractions'&&mode==='mixed-to-improper'){
    assert.ok(p.c>0&&p.c<p.b);
    assert.equal(p.answer,(p.a*p.b+p.c)+'/'+p.b);
   }
   if(topic==='fractions'&&mode==='divide-stories'){
    assert.ok(p.a>=3&&p.b%p.a!==0);
    assert.equal(BigInt(p.b)*BigInt(p.a),BigInt(Number(p.answer))*BigInt(p.a), 'fraction division cross-multiplication must be exact');
   }
   if(topic==='addition-pictures')assert.equal(Number(p.answer),p.a+p.b);
   if(topic==='place-value')assert.equal(String(p.a).length,7);
   if(topic==='division-equations'){
    const q=Math.floor(p.a/p.b),r=p.remainder??0;
    assert.equal(p.a,q*p.b+r);
    assert.ok(r>=0&&r<p.b);
    assert.ok(p.answer.includes(p.a+' / '+p.b+' = '+q));
   }
   exact++;
  }
 }
 assert.equal(exact,12*3*3*40);
});
test('R85 invalid values and tampered math refuse PDF output',async()=>{
 for(const topic of topics){
  const pack=createR85Pack(topic,20261104,8,'standard');
  for(const bad of [
   x=>{x.problems[0].answer='999';},
   x=>{x.problems[0].a=999;},
   x=>{x.problems[0].steps[0]='wrong reasoning';},
   x=>{x.problems[0].prompt='not the seeded source';}
  ]){
   const corrupt=structuredClone(pack);bad(corrupt);
   assert.throws(()=>verifyR85Pack(corrupt));
   await assert.rejects(createR85Pdf(corrupt,'questions','A4'));
  }
 }
 assert.throws(()=>createR85Pack('fractions',-1,8));
 assert.throws(()=>createR85Pack('addition-pictures',1,41));
 assert.throws(()=>createR85Pack('fractions',1,8,'standard','random'));
 assert.throws(()=>createR85Pack('fake',1,8));
});
test('R85 72 actual PDF combinations in Letter and A4, all three editions',async()=>{
 let count=0;
 for(const topic of topics)for(const mode of R85_MODES[topic])
 for(const paper of ['A4','Letter'])for(const edition of ['questions','answers','steps']){
  const pack=createR85Pack(topic,20261104,8,'standard',mode);
  const data=await createR85Pdf(pack,edition,paper,'standard');
  const doc=await PDFDocument.load(data);
  assert.equal(doc.getPageCount(),4);
  assert.ok(Math.abs(doc.getPage(0).getWidth()-(paper==='A4'?595.28:612))<.1);
  assert.match(doc.getTitle()??'',/R85/);
  assert.match(doc.getTitle()??'',new RegExp(topic));
  assert.match(doc.getTitle()??'',new RegExp(edition));
  assert.ok(data.length>3000);
  count++;
 }
 assert.equal(count,72);
});
test('R85 40-task pagination and concurrency do not mutate baseline v18 generators',async()=>{
 const originals=Object.fromEntries(Object.values(R85_ROUTES).map(x=>[x,
  makeWorksheet(x,20261104,8,'standard')]));
 const packs=topics.map(topic=>createR85Pack(topic,20261104,40,'challenge'));
 const docs=await Promise.all(packs.map(p=>createR85Pdf(p,'steps','Letter','extra')));
 for(const bytes of docs)assert.equal((await PDFDocument.load(bytes)).getPageCount(),20);
 for(const route of Object.values(R85_ROUTES))
  assert.deepEqual(makeWorksheet(route,20261104,8,'standard'),originals[route]);
});
test('R85 four versioned settings links restore modes with no student answers',()=>{
 assert.equal(EXTRA_PACK_KEYS.length,29);
 for(const topic of topics){
  const key='r85-'+topic+'-mode',options=R85_MODES[topic];
  const choices=[{key,allowed:options,defaultValue:options[0],selectedValue:options[1]}];
  const baseline='https://math-works.pages.dev/'+R85_ROUTES[topic]+'/?gv=18&seed=20261104&quantity=8';
  const share=buildExtraPackLink(baseline,choices);
  assert.equal(new URL(share).searchParams.get('xp_'+key),options[1]);
  assert.deepEqual(parseExtraPackLink(share,choices),{[key]:options[1]});
  assert.ok(!share.includes('student'));
  assert.deepEqual(parseExtraPackLink(share.replace('xpv=1','xpv=2'),choices),{});
 }
});
test('R85 eight exact historical missing keywords are resolved narrowly, no index launch',()=>{
 const flagged=[...flags62.flagged,...flags63.issues],seen=new Set();
 assert.equal(capability.keywordCapabilityUpdates.length,8);
 for(const row of capability.keywordCapabilityUpdates){
  assert.ok(!seen.has(row.keyword));seen.add(row.keyword);
  assert.equal(flagged.filter(f=>f.keyword===row.keyword&&f.slug===row.actualPage&&f.classification==='unsupported').length,1);
 }
 assert.equal(capability.approvedForIndexing,false);
 assert.equal(capability.originalOwner488RowsEdited,false);
 assert.equal(capability.physicalPrint,'NOT RUN');
});
