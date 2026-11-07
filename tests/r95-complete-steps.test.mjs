import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import routes from '../src/data/routes.json' with {type:'json'};
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
import {assertWorksheetMath} from '../src/lib/math-release-oracle.ts';
import {assertWorksheetSteps,INDEPENDENT_STEP_TOPICS} from '../src/lib/step-release-oracle.ts';
import {hasVerifiedSteps,verifiedStepTopics} from '../src/lib/capabilities.ts';

const R95 = {
 'inequalities-worksheets':[{coefficient:'positive'},{coefficient:'negative'}],
 'decimal-multiplication-worksheets':[{places:'1'},{places:'2'}],
 'place-value-worksheets':[{place:'ones',task:'digit'},{place:'billions',task:'value'},{place:'millions',task:'digit'},{place:'hundreds',task:'value'}],
 'decimal-place-value-worksheets':[{place:'tenths',task:'digit'},{place:'hundredths',task:'value'},{place:'thousandths',task:'round'},{place:'tenths',task:'round'}],
 'percentages-worksheets':[{direction:'fraction-to-percent'},{direction:'percent-to-fraction'},{direction:'percent-of-number'},{direction:'percent-change'}],
 'scientific-notation-worksheets':[{direction:'to-scientific',exponentSign:'negative',significantDigits:'4'},{direction:'to-scientific',exponentSign:'positive',significantDigits:'2'},{direction:'to-standard',exponentSign:'negative',significantDigits:'3'},{direction:'to-standard',exponentSign:'positive',significantDigits:'4'}],
 'gcf-worksheets':[{relation:'coprime'},{relation:'shared-factor'}],
 'systems-equations-worksheets':[{method:'simple',solutions:'negative'},{method:'general',solutions:'positive'},{method:'parallel'},{method:'coincident'}],
 'functions-worksheets':[{task:'evaluate'},{task:'solve-input'}],
 'function-tables-worksheets':[{task:'input',missing:'first'},{task:'output',missing:'last'},{task:'input',missing:'middle'}],
 'linear-equations-worksheets':[{task:'evaluate',slope:'zero'},{task:'graph',slope:'positive'},{task:'graph',slope:'negative'}],
 'slope-worksheets':[{line:'vertical'},{line:'nonvertical'}],
 'domain-range-worksheets':[{task:'domain',relation:'not-function'},{task:'range',relation:'function'},{task:'function-test',relation:'function'},{task:'function-test',relation:'not-function'}],
 'number-recognition-worksheets':[{task:'count-dots'},{task:'word-to-numeral'}],
 'number-line-worksheets':[{sign:'positive'},{sign:'negative'}],
 'coordinate-plane-worksheets':[{quadrant:'I'},{quadrant:'II'},{quadrant:'III'},{quadrant:'IV'}],
 'area-worksheets':[{shape:'rectangle'},{shape:'square'}],
 'surface-area-worksheets':[{solid:'cube'},{solid:'rectangular-prism'}],
 'angle-worksheets':[{kind:'acute'},{kind:'obtuse'}],
 'lines-rays-segments-worksheets':[{figure:'line'},{figure:'ray'},{figure:'segment'}],
 'mean-median-mode-range-worksheets':[{statistic:'mean',modePattern:'none'},{statistic:'median',modePattern:'single'},{statistic:'mode',modePattern:'two'},{statistic:'mode',modePattern:'none'},{statistic:'range',modePattern:'single'}],
 'box-plots-worksheets':[{statistic:'Q1'},{statistic:'median'},{statistic:'Q3'},{statistic:'IQR'},{statistic:'outliers'},{statistic:'draw'}],
 'scatter-plot-worksheets':[{task:'identify',trend:'positive'},{task:'identify',trend:'negative'},{task:'identify',trend:'none'},{task:'plot',trend:'positive'},{task:'plot',trend:'none'}],
 'printable-protractor':[{angleRange:'acute'},{angleRange:'obtuse'}]
};

test('R95: exactly 51 generators with independent base steps, all four HOLDs blocked',()=>{
 const active=routes.filter(r=>r.type!=='HOLD').map(r=>r.slug).sort();
 const enabled=verifiedStepTopics();
 assert.equal(active.length,51);
 assert.equal(Object.keys(R95).length,24);
 assert.equal(enabled.length,51);
 assert.deepEqual([...enabled].sort(),active);
 assert.deepEqual([...INDEPENDENT_STEP_TOPICS].sort(),active);
 assert.equal(new Set(enabled).size,51);
 for(const item of Object.keys(R95))assert.ok(hasVerifiedSteps(item),item);
 for(const item of routes.filter(r=>r.type==='HOLD'))assert.equal(hasVerifiedSteps(item.slug),false,item.slug);
});

test('R95: independently reconstruct 24 families including targeted variants across three difficulties',()=>{
 let cases=0;
 for(const [slug,variants] of Object.entries(R95)){
  for(const settings of [{},...variants]){
   for(const difficulty of ['easy','standard','challenge']){
    for(let seed=1;seed<=50;seed++){
     const worksheet=makeWorksheet(slug,seed,4,difficulty,settings);
     assertWorksheetMath(worksheet);
     assertWorksheetSteps(worksheet);
     cases+=worksheet.problems.length;
    }
   }
  }
 }
 assert.ok(cases>=35000,'Insufficient independent step audit samples '+cases);
});

test('R95: fake math steps fail closed while mathematically correct answer maps still pass',async()=>{
 for(const [slug,variants] of Object.entries(R95)){
  for(const settings of variants){
   const sheet=makeWorksheet(slug,20261107,4,'standard',settings);
   const bad={...sheet,problems:sheet.problems.map((p,i)=>i===0?{
    ...p,solutionSteps:[...p.solutionSteps.slice(0,-1),'Incorrect: 6 × 7 = 40.']
   }:p)};
   assert.doesNotThrow(()=>assertWorksheetMath(bad),slug+' answer map changed unexpectedly');
   assert.throws(()=>assertWorksheetSteps(bad),/Worked-step audit:/,slug);
   await assert.rejects(createWorksheetPdf(bad,slug,'steps','A4'),/Worked-step audit:/);
  }
 }
});

test('R95: all remaining families can create real answer-safe A4 and Letter teacher-step PDFs',async()=>{
 for(const [slug,variants] of Object.entries(R95)){
  for(const settings of [variants[0],variants.at(-1)]){
   const sheet=makeWorksheet(slug,20261107,4,'standard',settings);
   for(const paper of ['A4','Letter']){
    const bytes=await createWorksheetPdf(sheet,slug,'steps',paper);
    const doc=await PDFDocument.load(bytes);
    assert.ok(doc.getPageCount()>0,slug);
    assert.ok(doc.getTitle()?.includes(sheet.optionsHash),slug);
   }
  }
 }
});

test('R95: altered chart points, diagram labels and numeric geometry cannot bypass step math',()=>{
 for(const slug of ['slope-worksheets','coordinate-plane-worksheets','scatter-plot-worksheets',
  'number-line-worksheets','surface-area-worksheets','function-tables-worksheets']){
  const sheet=makeWorksheet(slug,7,4,'challenge');
  const p=sheet.problems[0];
  assert.ok(p.diagramSpec,slug);
  const poisoned={...p,diagramSpec:{...p.diagramSpec,values:[...p.diagramSpec.values]}};
  poisoned.diagramSpec.values[0]+=7;
  const altered={...sheet,problems:[poisoned,...sheet.problems.slice(1)]};
  assert.throws(()=>assertWorksheetSteps(altered),/Worked-step audit:/,slug);
 }
});
