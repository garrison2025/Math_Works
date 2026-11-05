import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {sampleProblem,makeWorksheet} from '../src/lib/math.ts';
import {normalizeTopicOptions,optionsFingerprint} from '../src/lib/topic-options.ts';
import {buildWorksheetLink,parseWorksheetLink} from '../src/lib/worksheet-link.ts';
import {trapezoidLayout} from '../src/lib/graph.ts';
import {diagramSVG} from '../src/lib/diagram.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';

const slug='area-of-trapezoids-worksheets';
const bases=(p)=>{
 const m=p.payload.question.match(/bases (\d+), (\d+) and (?:height|area) /);
 assert.ok(m,'Unparseable trapezoid prompt: '+p.payload.question);
 return [Number(m[1]),Number(m[2])];
};
test('R45 v18 trapezoid default, old seed and hash stay unchanged',()=>{
 const defaultOptions=normalizeTopicOptions(slug);
 assert.deepEqual(defaultOptions,{task:'area',baseRelation:'inclusive'});
 assert.equal(optionsFingerprint(slug,'standard',8,{}),'ba46b3e9');
 assert.equal(optionsFingerprint(slug,'standard',8,{task:'area'}),'ba46b3e9');
 assert.equal(optionsFingerprint(slug,'standard',8,{task:'area',baseRelation:'inclusive'}),'ba46b3e9');
 const old=sampleProblem(slug,20261104);
 assert.equal(old.payload.question,'A trapezoid has bases 15, 8 and height 16. Find area.');
 assert.equal(old.expectedAnswer,'184');
 assert.equal(old.diagramSpec.kind,'trapezoid');
 const s=makeWorksheet(slug,20261104,8,'standard');
 assert.equal(s.generatorVersion,'18');assert.equal(s.optionsHash,'ba46b3e9');
});

test('R45 unequal mode excludes equal bases for 1500 sample seeds per difficulty',()=>{
 let changed=0;
 for(const difficulty of ['easy','standard','challenge'])for(let seed=0;seed<1500;seed++){
  const p=sampleProblem(slug,seed,difficulty,{baseRelation:'unequal'});
  const [bottom,top]=bases(p);
  assert.notEqual(bottom,top, `${difficulty} seed ${seed}`);
  const before=sampleProblem(slug,seed,difficulty,{baseRelation:'inclusive'});
  if(before.diagramSpec.values[0]===before.diagramSpec.values[1])changed++;
  else assert.deepEqual(p,before,'Unequal setting changed an already-valid historic question');
  const g=trapezoidLayout(p.diagramSpec);
  assert.notEqual(g.bottomWidth,g.topWidth,'Rendered silhouette should have distinct parallel bases');
  assert.match(diagramSVG(p.diagramSpec),/Schematic - not to scale/);
  const area=bottom*0+Number(p.diagramSpec.values[2]); // safe when full area task
  assert.ok(Number.isFinite(area)&&area>0);
 }
 assert.ok(changed>=100,'Too few equality-replacement edge cases exercised: '+changed);
});

test('R45 exact trapezoid answers and missing-height work in both definitions',()=>{
 for(const baseRelation of ['inclusive','unequal'])for(const task of ['area','missing-height'])
  for(let seed=1;seed<=500;seed++){
   const p=sampleProblem(slug,seed,'standard',{task,baseRelation});
   const [x,y]=bases(p);
   const h=task==='area'?p.diagramSpec.values[2]:Number(p.expectedAnswer);
   const actual=(x+y)*h/2;
   if(task==='area')assert.equal(Number(p.expectedAnswer),actual);
   else{
    const m=p.payload.question.match(/and area (\d+(?:\.\d+)?) square units/);
    assert.ok(m);assert.equal(Number(m[1]),actual);
   }
   if(baseRelation==='unequal')assert.notEqual(x,y);
   assert.ok(p.solutionSteps.every(s=>s.trim().length>2));
  }
});

test('R45 strict worksheets print as reproducible 40-problem vectors on A4 and Letter',async()=>{
 for(const task of ['area','missing-height']){
  const options={task,baseRelation:'unequal'};
  const sheet=makeWorksheet(slug,20261105,40,'challenge',options);
  assert.equal(sheet.problems.length,40);
  assert.ok(sheet.problems.every(p=>{const [x,y]=bases(p);return x!==y;}));
  assert.notEqual(sheet.optionsHash,makeWorksheet(slug,20261105,40,'challenge',{task}).optionsHash);
  for(const paper of ['A4','Letter'])for(const mode of ['questions','answers','steps']){
   const bytes=await createWorksheetPdf(sheet,'Area Of Trapezoids Worksheets',mode,paper);
   const doc=await PDFDocument.load(bytes);
   assert.ok(doc.getPageCount()>0&&doc.getTitle().includes(sheet.optionsHash));
  }
 }
});

test('R45 share-link options round trip without altering original seed',()=>{
 for(const opt of ['inclusive','unequal']){
  const options=normalizeTopicOptions(slug,{task:'missing-height',baseRelation:opt});
  const expected={seed:20261104,quantity:8,difficulty:'standard',paper:'A4',options};
  const url=buildWorksheetLink('https://math-works.pages.dev/area-of-trapezoids-worksheets/',slug,expected);
  assert.match(url,/gv=18/);
  assert.ok(url.includes('opt_baseRelation='+opt));
  const parsed=parseWorksheetLink(url,slug);
  assert.deepEqual(parsed,expected);
  assert.deepEqual(makeWorksheet(slug,expected.seed,expected.quantity,expected.difficulty,expected.options),
   makeWorksheet(slug,parsed.seed,parsed.quantity,parsed.difficulty,parsed.options));
 }
});
