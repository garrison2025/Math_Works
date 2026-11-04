import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf,createBlankProtractorPdf,ascii} from '../src/lib/pdf.ts';
import {hasVerifiedSteps} from '../src/lib/capabilities.ts';
const mathTopics=[
 'two-step-equations-worksheets','adding-unlike-fractions-worksheets',
 'two-digit-multiplication-worksheets','pythagorean-worksheets',
 'box-plots-worksheets','printable-protractor',
 'triangle-angle-sum-worksheets','volume-of-rectangular-prisms-worksheets',
 'inequalities-worksheets','scatter-plot-worksheets','linear-equations-worksheets'
];
const sizes={Letter:[612,792],A4:[595.28,841.89]};
for(const topic of mathTopics)test(`PDF roundtrip: ${topic}`,async()=>{
 for(const paper of ['Letter','A4'])for(const mode of ['questions','answers','steps']){
  if(mode==='steps'&&!hasVerifiedSteps(topic))continue;
  const sheet=makeWorksheet(topic,20261104,8,'standard');
  const bytes=await createWorksheetPdf(sheet,topic,mode,paper);
  assert.ok(bytes.byteLength>1000,`empty output ${topic} ${mode} ${paper}`);
  const doc=await PDFDocument.load(bytes);
  assert.ok(doc.getPageCount()>=1);
  const [width,height]=sizes[paper];
  for(const page of doc.getPages()){
   assert.ok(Math.abs(page.getWidth()-width)<.015);
   assert.ok(Math.abs(page.getHeight()-height)<.015);
  }
  assert.ok(doc.getTitle()?.includes(sheet.seed.toString()));
  assert.ok(doc.getTitle()?.includes(sheet.optionsHash),`PDF config identity missing: ${topic} ${paper} ${mode}`);
 }
});
test('PDF steps reject unreviewed topics rather than imply verified solution',async()=>{
 const sheet=makeWorksheet('box-plots-worksheets',7,8);
 await assert.rejects(()=>createWorksheetPdf(sheet,'Box Plots','steps','Letter'),/not yet verified/);
});
test('multipage output has no zero-page or lost-page failures',async()=>{
 for(const topic of ['two-step-equations-worksheets','box-plots-worksheets']){
  for(const quantity of [1,8,20,40]){
   const sheet=makeWorksheet(topic,20261104,quantity);
   const doc=await PDFDocument.load(await createWorksheetPdf(sheet,topic,'answers','A4'));
   assert.ok(doc.getPageCount()>0);
   if(quantity===40)assert.ok(doc.getPageCount()>1);
  }
 }
});

test('PDF text transliteration preserves function-table arrows',()=>{
 assert.equal(ascii('1→2; -3 ← 4; 5 × 6'), '1 -> 2; -3  <-  4; 5 x 6');
});
test('blank protractor PDF is single page on Letter and A4',async()=>{
 for(const paper of ['Letter','A4']){
  const bytes=await createBlankProtractorPdf(paper);
  assert.ok(bytes.byteLength>2000);
  const doc=await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(),1);
  const [w,h]=sizes[paper];assert.ok(Math.abs(doc.getPage(0).getWidth()-w)<.015);assert.ok(Math.abs(doc.getPage(0).getHeight()-h)<.015);
 }
});

test('protractor exercise sheets reserve enough physical space per page',async()=>{
 for(const paper of ['Letter','A4']){
  const sheet=makeWorksheet('printable-protractor',20261104,4);
  const doc=await PDFDocument.load(await createWorksheetPdf(sheet,'Printable Protractor','questions',paper));
  assert.ok(doc.getPageCount()>=2,`${paper} failed to break full-size protractors across pages`);
 }
});


test('PDF config fingerprint distinguishes selected fraction operations without changing answer identity',async()=>{
 const addition=makeWorksheet('fractions-worksheets',20261104,8,'standard',{operation:'addition'});
 const subtraction=makeWorksheet('fractions-worksheets',20261104,8,'standard',{operation:'subtraction'});
 assert.notEqual(addition.optionsHash,subtraction.optionsHash);
 for(const sheet of [addition,subtraction]){
  const [practice,answers]=await Promise.all([
   createWorksheetPdf(sheet,'Fraction Practice','questions','Letter'),
   createWorksheetPdf(sheet,'Fraction Practice','answers','Letter')
  ]);
  for(const bytes of [practice,answers]){
   const doc=await PDFDocument.load(bytes);
   assert.ok(doc.getTitle()?.includes(sheet.optionsHash));
   assert.ok(doc.getPageCount()>=1);
  }
  assert.equal(sheet.answerMap.length,sheet.problems.length);
  sheet.answerMap.forEach((v,i)=>assert.equal(v.answer,sheet.problems[i].expectedAnswer));
 }
});

test('selected topic choices keep practice and answer PDF metadata aligned',async()=>{
 const examples=[
  ['addition-worksheets',{regrouping:'no'}],
  ['subtraction-worksheets',{borrowing:'yes'}],
  ['percentages-worksheets',{direction:'percent-to-fraction'}],
  ['functions-worksheets',{task:'solve-input'}],
  ['volume-of-rectangular-prisms-worksheets',{task:'missing-height'}],
  ['scientific-notation-worksheets',{direction:'to-standard'}]
 ];
 for(const [topic,options] of examples){
  const sheet=makeWorksheet(topic,1956,8,'challenge',options);
  const [practice,answerKey]=await Promise.all([
   createWorksheetPdf(sheet,topic,'questions','A4'),
   createWorksheetPdf(sheet,topic,'answers','A4')
  ]);
  for(const bytes of [practice,answerKey]){
   const doc=await PDFDocument.load(bytes);
   assert.ok(doc.getTitle()?.includes(sheet.optionsHash),`${topic}: configuration metadata absent`);
   assert.ok(doc.getTitle()?.includes('1956'),`${topic}: seed metadata absent`);
   assert.ok(doc.getPageCount()>=1);
  }
  assert.deepEqual(sheet.problems.map(({id,expectedAnswer})=>({id,answer:expectedAnswer})),sheet.answerMap);
 }
});

// R9: content and answer-key identity for every newly parameterized family whose
// problem text or layout is materially different from the R8 default.
test('new R9 configured worksheets generate paired printable PDF documents',async()=>{
 const examples=[
  ['adding-unlike-fractions-worksheets',{sumType:'proper'}],
  ['area-of-triangles-worksheets',{task:'missing-height'}],
  ['area-of-parallelograms-worksheets',{task:'missing-height'}],
  ['area-of-trapezoids-worksheets',{task:'missing-height'}],
  ['triangle-angle-sum-worksheets',{thirdAngle:'right'}],
  ['surface-area-worksheets',{solid:'cube'}],
  ['function-tables-worksheets',{missing:'first'}],
  ['number-recognition-worksheets',{task:'word-to-numeral'}],
  ['linear-equations-worksheets',{slope:'zero'}],
  ['mean-absolute-deviation-worksheets',{distribution:'skewed'}]
 ];
 for(const [topic,options] of examples){
  const set=makeWorksheet(topic,20261104,8,'standard',options);
  assert.ok(set.optionsHash);
  for(const paper of ['Letter','A4']){
   const worksheets=await Promise.all(['questions','answers'].map(mode=>createWorksheetPdf(set,topic,mode,paper)));
   const docs=await Promise.all(worksheets.map(bytes=>PDFDocument.load(bytes)));
   for(const doc of docs){
    assert.ok(doc.getPageCount()>0,`${topic} ${paper} zero pages`);
    assert.ok(doc.getTitle()?.includes(set.optionsHash),`${topic} missing configuration ID`);
    assert.ok(doc.getTitle()?.includes('v7'),`${topic} missing version-seven identity`);
   }
  }
 }
});


test('R10 font-metric wrapping never crosses the printable content width',async()=>{
 const {wrapPdfText}=await import('../src/lib/pdf.ts');
 const doc=await PDFDocument.create(),font=await doc.embedFont('Helvetica');
 for(const width of [170,260,490])for(const text of [
  'An exceptionally long classroom question with coefficients and fractional values to display in the PDF export.',
  '123456789012345678901234567890123456789012345678901234567890',
  'Find Q1 for [3, 4, 15, 22, 38, 60, 101, 120] using the median-of-halves definition.'
 ]){
  const lines=wrapPdfText(text,font,10,width);
  assert.ok(lines.length>0);
  for(const line of lines)assert.ok(font.widthOfTextAtSize(line,10)<=width+0.01,`Line exceeded ${width}pt: ${line}`);
 }
});

test('R10 PDF export rejects stale or corrupted answer mappings',async()=>{
 const set=makeWorksheet('two-step-equations-worksheets',63,8);
 set.answerMap[3].answer='incorrect answer';
 await assert.rejects(()=>createWorksheetPdf(set,'Two Step Equations','questions','Letter'),/Answer key mismatch/);
});

test('R10 all 51 live worksheet topics export parsable practice and answers on both paper sizes',async()=>{
 const {readFileSync}=await import('node:fs');
 const routes=JSON.parse(readFileSync(new URL('../src/data/routes.json',import.meta.url),'utf8'));
 for(const [index,{slug,type}] of routes.entries()){
  if(type==='HOLD')continue;
  const set=makeWorksheet(slug,101+index,8,'standard');
  for(const paper of ['Letter','A4'])for(const mode of ['questions','answers']){
   const pdf=await PDFDocument.load(await createWorksheetPdf(set,slug,mode,paper));
   assert.ok(pdf.getPageCount()>=1,`${slug} ${mode} ${paper}`);
   const first=pdf.getPages()[0];
   const dims=paper==='Letter'?[612,792]:[595.28,841.89];
   assert.ok(Math.abs(first.getWidth()-dims[0])<0.05);
   assert.ok(Math.abs(first.getHeight()-dims[1])<0.05);
   assert.ok(pdf.getTitle()?.includes(set.optionsHash));
  }
 }
});

test('R11 full-size column multiplication and long-division diagrams survive practice PDF serialization',async()=>{
 for(const topic of ['two-digit-multiplication-worksheets','two-digit-by-one-digit-multiplication-worksheets','three-digit-by-two-digit-multiplication-worksheets','long-division-worksheets']){
  const sheet=makeWorksheet(topic,20261104,8,'standard');
  assert.ok(sheet.problems.every(p=>p.diagramSpec));
  for(const paper of ['Letter','A4']){
   const pdf=await PDFDocument.load(await createWorksheetPdf(sheet,topic,'questions',paper));
   assert.ok(pdf.getPageCount()>0,`${topic} ${paper} failed`);
   assert.equal(pdf.getTitle()?.includes(sheet.optionsHash),true);
  }
 }
});

test('R13 diagram corrections serialize true intersecting lines, square faces, and line/ray/segment choices',async()=>{
 const examples=[
  ['vertical-angles-worksheets',{task:'vertical'}],
  ['vertical-angles-worksheets',{task:'adjacent'}],
  ['area-worksheets',{shape:'square'}],
  ['surface-area-worksheets',{solid:'cube'}],
  ['lines-rays-segments-worksheets',{figure:'line'}],
  ['lines-rays-segments-worksheets',{figure:'ray'}],
  ['lines-rays-segments-worksheets',{figure:'segment'}]
 ];
 for(const [topic,options] of examples){
  const sheet=makeWorksheet(topic,20261104,8,'standard',options);
  assert.equal(sheet.generatorVersion,'7');
  assert.ok(sheet.problems.every(problem=>!!problem.diagramSpec));
  for(const paper of ['Letter','A4'])for(const mode of ['questions','answers']){
   const bytes=await createWorksheetPdf(sheet,topic,mode,paper);
   const document=await PDFDocument.load(bytes);
   assert.ok(document.getPageCount()>=1,`${topic} ${paper} ${mode}`);
   assert.ok(document.getTitle()?.includes(sheet.optionsHash));
   assert.ok(document.getTitle()?.includes('v7'));
  }
 }
});

test('R14 general systems and non-function domains export consistent A4/Letter question and answer PDFs',async()=>{
 for(const [topic,options] of [
  ['systems-equations-worksheets',{method:'general',solutions:'negative'}],
  ['domain-range-worksheets',{task:'range',relation:'not-function'}]
 ])for(const paper of ['Letter','A4']){
  const sheet=makeWorksheet(topic,20261105,30,'challenge',options);
  for(const mode of ['questions','answers']){
   const raw=await createWorksheetPdf(sheet,topic,mode,paper);
   const parsed=await PDFDocument.load(raw);
   assert.ok(parsed.getPageCount()>=1,`${topic} ${mode} PDF empty`);
   assert.ok(parsed.getTitle()?.includes(sheet.optionsHash));
   assert.match(parsed.getTitle()??'',/generator v7/);
   assert.ok(Math.abs(parsed.getPage(0).getWidth()-(paper==='A4'?595.28:612))<.06);
  }
 }
});


test('R15 parallel, coincident and function classification worksheets serialize paired Letter/A4 PDF sets',async()=>{
 const combinations=[
  ['systems-equations-worksheets',{method:'parallel',solutions:'mixed'},'no solution'],
  ['systems-equations-worksheets',{method:'coincident',solutions:'mixed'},'infinitely many solutions'],
  ['domain-range-worksheets',{task:'function-test',relation:'function'},'yes'],
  ['domain-range-worksheets',{task:'function-test',relation:'not-function'},'no']
 ];
 for(const [topic,options,expected] of combinations){
  const sheet=makeWorksheet(topic,20261105,20,'standard',options);
  assert.ok(sheet.problems.every(p=>p.expectedAnswer===expected));
  for(const paper of ['Letter','A4'])for(const mode of ['questions','answers']){
   const pdf=await PDFDocument.load(await createWorksheetPdf(sheet,topic,mode,paper));
   assert.ok(pdf.getPageCount()>0);
   assert.match(pdf.getTitle()??'',/generator v7/);
   assert.ok(pdf.getTitle()?.includes(sheet.optionsHash));
   assert.equal(pdf.getPage(0).getWidth(),sizes[paper][0]);
  }
 }
});
