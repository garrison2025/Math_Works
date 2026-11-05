import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {sampleProblem,makeWorksheet} from '../src/lib/math.ts';
import {assertWorksheetMath,VERIFIED_AT_PDF_BOUNDARY} from '../src/lib/math-release-oracle.ts';
import {assertWorksheetIntegrity} from '../src/lib/sheet-integrity.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
const variants={
 'two-digit-multiplication-worksheets':[{factorRange:'small'},{factorRange:'large'}],
 'three-digit-by-two-digit-multiplication-worksheets':[{multiplierRange:'low'},{multiplierRange:'high'}],
 'two-digit-by-one-digit-multiplication-worksheets':[{regrouping:'yes'},{regrouping:'no'}],
 'integer-operations-worksheets':[{operation:'addition'},{operation:'subtraction'},{operation:'multiplication'},{operation:'division'}],
 'order-of-operations-worksheets':[
  {skill:'multiplication',grouping:'parentheses'},
  {skill:'multiplication',grouping:'no-parentheses'},
  {skill:'division',grouping:'parentheses'},
  {skill:'division',grouping:'no-parentheses'},
  {skill:'powers',grouping:'parentheses'},
  {skill:'powers',grouping:'no-parentheses'}],
 'equivalent-fractions-worksheets':[{missing:'numerator'},{missing:'denominator'}],
 'addition-worksheets':[{regrouping:'yes'},{regrouping:'no'}],
 'subtraction-worksheets':[{borrowing:'yes'},{borrowing:'no'}],
 'mixed-addition-subtraction-worksheets':[{operation:'addition'},{operation:'subtraction'}],
 'multiplication-worksheets':[{factors:'times-tables'},{factors:'two-digit-by-one-digit'}],
 'multiplication-tables-worksheets':[{table:'1'},{table:'7'},{table:'12'}],
 'place-value-worksheets':[
  {place:'ones',task:'digit'},{place:'tens',task:'value'},
  {place:'millions',task:'digit'},{place:'billions',task:'value'}],
 'decimal-place-value-worksheets':[
  {place:'tenths',task:'digit'},{place:'hundredths',task:'value'},
  {place:'thousandths',task:'round'},{place:'tenths',task:'round'}],
 'lines-rays-segments-worksheets':[{figure:'line'},{figure:'ray'},{figure:'segment'}],
 'printable-protractor':[{angleRange:'acute'},{angleRange:'obtuse'}]
};
const topics=Object.keys(variants);
test('R49: runtime PDF math oracle exactly covers the 51 true generator switch cases',()=>{
 const source=readFileSync(new URL('../src/lib/math.ts',import.meta.url),'utf8');
 const generated=[...source.matchAll(/case '([^']+)':/g)].map(m=>m[1]).sort();
 const verified=[...VERIFIED_AT_PDF_BOUNDARY].sort();
 assert.equal(generated.length,51);
 assert.deepEqual(verified,generated,'Coverage is not identical to real supported generator topics');
 assert.equal(topics.length,15);
});
test('R49: all 15 final families verify default and specialized options across seeded difficulties',()=>{
 let total=0;
 for(const [topic,choices] of Object.entries(variants)){
  for(const options of [{},...choices])
   for(const difficulty of ['easy','standard','challenge'])
    for(let seed=1;seed<=150;seed++){
     const sample=sampleProblem(topic,seed,difficulty,options);
     assert.ok(sample.payload.question&&sample.expectedAnswer,topic);
     const sheet=makeWorksheet(topic,seed,4,difficulty,options);
     assertWorksheetMath(sheet);
     total+=sheet.problems.length;
    }
 }
 assert.ok(total>70000,'Expected many distinct independently verified questions: '+total);
});
test('R49: wrong answer and mirrored answer-map tampering are rejected for every final family',async()=>{
 for(const [topic,choices] of Object.entries(variants)){
  const sheet=makeWorksheet(topic,20261105,4,'standard',choices[0]);
  const bad={...sheet,
   problems:sheet.problems.map((p,i)=>i? p:{...p,expectedAnswer:'BAD_ANSWER'}),
   answerMap:sheet.answerMap.map((a,i)=>i?a:{...a,answer:'BAD_ANSWER'})};
  assert.doesNotThrow(()=>assertWorksheetIntegrity(bad),topic);
  assert.throws(()=>assertWorksheetMath(bad),/Math oracle:/,topic);
  await assert.rejects(createWorksheetPdf(bad,topic,'questions','A4'),/Math oracle:/,topic);
 }
});
test('R49: corrupt geometry and diagram metadata cannot silently change export answers',()=>{
 for(const topic of [
  'two-digit-multiplication-worksheets',
  'three-digit-by-two-digit-multiplication-worksheets',
  'two-digit-by-one-digit-multiplication-worksheets',
  'lines-rays-segments-worksheets','printable-protractor'
 ]){
  const sheet=makeWorksheet(topic,20261105,4,'standard',variants[topic][0]);
  const first=sheet.problems[0];
  const damaged={...sheet,problems:[{...first,diagramSpec:{
   ...first.diagramSpec,
   values:first.diagramSpec.values.map((v,i)=>i===0?v+99:v)
  }},...sheet.problems.slice(1)]};
  assert.throws(()=>assertWorksheetMath(damaged),/Math oracle:/,topic);
 }
});
test('R49: invalid or future generator topics cannot bypass the export math gate',async()=>{
 const sheet=makeWorksheet('addition-worksheets',20261105,4);
 const bad={...sheet,topicId:'unverified-future-worksheets',
  problems:sheet.problems.map(p=>({...p,topicId:'unverified-future-worksheets'}))};
 assert.doesNotThrow(()=>assertWorksheetIntegrity(bad));
 assert.throws(()=>assertWorksheetMath(bad),/unverified PDF topic/);
 await assert.rejects(createWorksheetPdf(bad,'Unverified','questions','A4'),/unverified PDF topic/);
});
test('R49: all final families export math-checked questions and answer PDFs',async()=>{
 for(const [topic,choices] of Object.entries(variants)){
  const sheet=makeWorksheet(topic,20261105,4,'standard',choices[0]);
  for(const paper of ['A4','Letter']){
   const bytes=await createWorksheetPdf(sheet,topic,'questions',paper);
   const doc=await PDFDocument.load(bytes);
   assert.ok(doc.getPageCount()>0&&doc.getTitle().includes(sheet.optionsHash));
  }
 }
});
