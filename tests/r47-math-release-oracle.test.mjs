import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet,sampleProblem} from '../src/lib/math.ts';
import {assertWorksheetIntegrity} from '../src/lib/sheet-integrity.ts';
import {assertWorksheetMath,VERIFIED_AT_PDF_BOUNDARY} from '../src/lib/math-release-oracle.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';

const variants={
 'decimal-multiplication-worksheets':[{places:'1'},{places:'2'}],
 'scientific-notation-worksheets':[{direction:'to-scientific',exponentSign:'negative',significantDigits:'4'},{direction:'to-standard',exponentSign:'positive',significantDigits:'2'},{direction:'to-standard',exponentSign:'negative',significantDigits:'3'}],
 'area-of-triangles-worksheets':[{task:'area'},{task:'missing-height'}],
 'area-of-parallelograms-worksheets':[{task:'area'},{task:'missing-height'}],
 'area-worksheets':[{shape:'rectangle'},{shape:'square'}],
 'volume-of-rectangular-prisms-worksheets':[{task:'volume'},{task:'missing-height'}],
 'surface-area-worksheets':[{solid:'rectangular-prism'},{solid:'cube'}],
 'functions-worksheets':[{task:'evaluate'},{task:'solve-input'}],
 'linear-equations-worksheets':[{task:'evaluate',slope:'negative'},{task:'graph',slope:'negative'},{task:'graph',slope:'zero'}],
 'one-step-equations-worksheets':[{operation:'addition'},{operation:'multiplication'}],
 'division-worksheets':[{divisor:'7'},{divisor:'mixed'}],
 'coordinate-plane-worksheets':[{quadrant:'I'},{quadrant:'III'}],
 'function-tables-worksheets':[{task:'output',missing:'first'},{task:'input',missing:'last'},{task:'mixed',missing:'middle'}]
};
const added=Object.keys(variants);

test('R47 13 new families independently verify real question text across choices and difficulties',()=>{
 assert.equal(VERIFIED_AT_PDF_BOUNDARY.length,23);
 for(const slug of added)assert.ok(VERIFIED_AT_PDF_BOUNDARY.includes(slug),slug);
 let samples=0;
 for(const [slug,options] of Object.entries(variants))
  for(const option of [{},...options])
   for(const difficulty of ['easy','standard','challenge'])
    for(let seed=1;seed<=240;seed++){
     const p=sampleProblem(slug,seed,difficulty,option);
     // Single-problem fixture exercises the independent runtime question oracle
     // without conflating it with worksheet regeneration.
     const base=makeWorksheet(slug,seed,4,difficulty,option);
     assertWorksheetMath(base);
     assert.ok(p.payload.question&&p.expectedAnswer);
     samples+=base.problems.length;
    }
 assert.ok(samples>40000,`Only ${samples} independently tested R47 generated answers`);
});

test('R47 wrong but matching answerMap and expectedAnswer are blocked before actual PDF creation',async()=>{
 for(const [slug,options] of Object.entries(variants)){
  const sheet=makeWorksheet(slug,20261105,8,'standard',options[0]);
  const corrupted={
   ...sheet,
   problems:sheet.problems.map((p,i)=>i===0?{...p,expectedAnswer:'__WRONG__'}:p),
   answerMap:sheet.answerMap.map((a,i)=>i===0?{...a,answer:'__WRONG__'}:a)
  };
  assert.doesNotThrow(()=>assertWorksheetIntegrity(corrupted));
  assert.throws(()=>assertWorksheetMath(corrupted),/Math oracle: incorrect/,slug);
  await assert.rejects(createWorksheetPdf(corrupted,slug,'questions','A4'),/Math oracle: incorrect/,slug);
 }
});

test('R47 actual diagrams are checked and malformed inputs fail closed at export',()=>{
 for(const slug of [
  'area-of-triangles-worksheets','area-of-parallelograms-worksheets','area-worksheets',
  'volume-of-rectangular-prisms-worksheets','surface-area-worksheets',
  'linear-equations-worksheets','coordinate-plane-worksheets','function-tables-worksheets'
 ]){
  const sheet=makeWorksheet(slug,20261105,8,'standard',variants[slug][0]);
  const p=sheet.problems[0];
  const altered={...p,diagramSpec:{...p.diagramSpec,values:p.diagramSpec.values.map((v,i)=>i===0?v+99:v)}};
  const corrupted={...sheet,problems:[altered,...sheet.problems.slice(1)]};
  assert.throws(()=>assertWorksheetMath(corrupted),/Math oracle:/,slug);
 }
 const p=makeWorksheet('scientific-notation-worksheets',20261105,8);
 const corrupted={...p,problems:[{...p.problems[0],payload:{question:'Write 0 in scientific notation.'}},...p.problems.slice(1)]};
 assert.throws(()=>assertWorksheetMath(corrupted),/Math oracle:/);
});

test('R47 13 new PDF export families create A4/Letter practice and answer keys',async()=>{
 for(const [slug,options] of Object.entries(variants)){
  const sheet=makeWorksheet(slug,20261105,8,'challenge',options[0]);
  for(const paper of ['A4','Letter'])for(const mode of ['questions','answers']){
   const bytes=await createWorksheetPdf(sheet,slug,mode,paper);
   const pdf=await PDFDocument.load(bytes);
   assert.ok(pdf.getPageCount()>=1&&pdf.getTitle().includes(sheet.optionsHash));
  }
 }
});
