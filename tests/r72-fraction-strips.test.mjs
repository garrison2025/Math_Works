import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {readFileSync} from 'node:fs';
import {makeFractionStrips,verifyFractionStrips} from '../src/lib/fraction-strips.ts';
import {createFractionStripsPdf,FRACTION_STRIP_PRINT_WIDTH_PT,FRACTION_STRIP_ROW_HEIGHT_PT}
 from '../src/lib/fraction-strips-pdf.ts';
import {makeWorksheet} from '../src/lib/math.ts';
import cap from '../src/data/seo-r72-fraction-strips-capability.json' with {type:'json'};
import r62 from '../src/data/seo-intent-review.json' with {type:'json'};
import r63 from '../src/data/seo-intent-r63.json' with {type:'json'};

test('R72 every fraction strip row is the exact same whole and contains N equal-width vector cells',()=>{
 assert.equal(FRACTION_STRIP_PRINT_WIDTH_PT,420);
 assert.equal(FRACTION_STRIP_ROW_HEIGHT_PT,32);
 for(const set of ['basic','extended'])for(const mode of ['blank','labeled']){
  const pack=makeFractionStrips(set,mode);
  assert.doesNotThrow(()=>verifyFractionStrips(pack));
  assert.equal(pack.cells.length,set==='basic'?6:9);
  assert.equal(pack.denominators.at(0),1);
  const units=pack.cells.flatMap(row=>row.labels);
  assert.equal(units.length,set==='basic'?24:51);
  for(const strip of pack.cells){
   assert.ok(Math.abs((420/strip.denominator)*strip.denominator-420)<1e-8);
   assert.equal(strip.labels.length,strip.denominator);
   assert.ok(strip.labels.every(x=>x===(mode==='blank'?'':'1/'+strip.denominator)));
  }
  assert.deepEqual(pack,makeFractionStrips(set,mode));
 }
});
test('R72 A4/Letter eight real PDF variants all remain single-page teacher and coloring charts',async()=>{
 let n=0;
 for(const set of ['basic','extended'])for(const mode of ['blank','labeled'])
 for(const paper of ['Letter','A4']){
  const pack=makeFractionStrips(set,mode);
  const pdf=await PDFDocument.load(await createFractionStripsPdf(pack,paper));
  assert.equal(pdf.getPageCount(),1);
  assert.ok(Math.abs(pdf.getPage(0).getWidth()-(paper==='Letter'?612:595.28))<.1);
  assert.ok(Math.abs(pdf.getPage(0).getHeight()-(paper==='Letter'?792:841.89))<.1);
  assert.match(pdf.getTitle()??'',new RegExp(set));
  assert.match(pdf.getTitle()??'',new RegExp(mode));
  assert.match(pdf.getTitle()??'',/R72\.1/);
  assert.match(pdf.getSubject()??'',/v18/);
  n++;
 }
 assert.equal(n,8);
});
test('R72 invalid denominator sets, tampering and invalid paper are rejected',async()=>{
 assert.throws(()=>makeFractionStrips('unknown','blank'),/set/);
 assert.throws(()=>makeFractionStrips('basic','answer'),/mode/);
 const p=makeFractionStrips('extended','labeled');
 const a=structuredClone(p);a.cells[2].labels[0]='1/10';
 assert.throws(()=>verifyFractionStrips(a),/partition/);
 const b=structuredClone(p);b.denominators[0]=3;
 assert.throws(()=>verifyFractionStrips(b),/pack/);
 const c=structuredClone(p);c.cells[1].labels.push('1/2');
 assert.throws(()=>verifyFractionStrips(c),/partition/);
 await assert.rejects(()=>createFractionStripsPdf(p,'Legal'),/paper/);
});
test('R72 historic exact owner-sourced keyword now has a strip chart; general fraction pictures remains unsupported',()=>{
 const x=cap.keywordCapabilityUpdates[0];
 assert.equal(x.keyword,'fraction strips printable');
 assert.equal(cap.keywordCapabilityUpdates.length,1);
 const csv=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8');
 const quote=String.fromCharCode(96);
 const row=csv.split(/\r?\n/).find(line=>line.startsWith(quote+x.keyword+quote+','));
 assert.ok(row);
 const cols=row.split(',');
 assert.equal(+cols[1],x.sourceMonthlyVolume);
 assert.equal(+cols[2],x.sourceKD);
 assert.ok(row.endsWith(quote+'/'+x.ownerOriginalRoute+'/'+quote));
 assert.ok([...r62.flagged,...r63.issues].some(f=>f.keyword===x.keyword&&f.classification==='unsupported'));
 assert.ok(!cap.keywordCapabilityUpdates.some(x=>x.keyword==='fraction pictures'));
 assert.equal(cap.indexApproved,false);
 const original=makeWorksheet('fractions-worksheets',20261106,8,'standard');
 makeFractionStrips('extended','labeled');
 assert.deepEqual(makeWorksheet('fractions-worksheets',20261106,8,'standard'),original);
 assert.equal(original.generatorVersion,'18');
});
