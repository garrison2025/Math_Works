import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet,sampleProblem} from '../src/lib/math.ts';
import {assertWorksheetMath,VERIFIED_AT_PDF_BOUNDARY} from '../src/lib/math-release-oracle.ts';
import {assertWorksheetIntegrity} from '../src/lib/sheet-integrity.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
const variants={
  "number-line-worksheets": [
    {
      "sign": "positive"
    },
    {
      "sign": "negative"
    }
  ],
  "number-recognition-worksheets": [
    {
      "task": "count-dots"
    },
    {
      "task": "word-to-numeral"
    }
  ],
  "gcf-worksheets": [
    {
      "relation": "coprime"
    },
    {
      "relation": "shared-factor"
    }
  ],
  "triangle-angle-sum-worksheets": [
    {
      "thirdAngle": "acute"
    },
    {
      "thirdAngle": "right"
    },
    {
      "thirdAngle": "obtuse"
    }
  ],
  "complementary-supplementary-angles-worksheets": [
    {
      "relation": "complementary"
    },
    {
      "relation": "supplementary"
    }
  ],
  "vertical-angles-worksheets": [
    {
      "task": "vertical"
    },
    {
      "task": "adjacent"
    }
  ],
  "angle-worksheets": [
    {
      "kind": "acute"
    },
    {
      "kind": "obtuse"
    }
  ],
  "mean-absolute-deviation-worksheets": [
    {
      "distribution": "symmetric",
      "size": "5"
    },
    {
      "distribution": "skewed",
      "size": "8"
    }
  ],
  "box-plots-worksheets": [
    {
      "statistic": "draw"
    },
    {
      "statistic": "outliers"
    },
    {
      "statistic": "Q1"
    },
    {
      "statistic": "Q3"
    },
    {
      "statistic": "IQR"
    },
    {
      "statistic": "median"
    }
  ],
  "scatter-plot-worksheets": [
    {
      "task": "identify",
      "trend": "positive"
    },
    {
      "task": "identify",
      "trend": "negative"
    },
    {
      "task": "identify",
      "trend": "none"
    },
    {
      "task": "plot",
      "trend": "positive"
    },
    {
      "task": "plot",
      "trend": "none"
    }
  ],
  "slope-worksheets": [
    {
      "line": "vertical"
    },
    {
      "line": "nonvertical"
    }
  ],
  "domain-range-worksheets": [
    {
      "task": "domain",
      "relation": "function"
    },
    {
      "task": "range",
      "relation": "not-function"
    },
    {
      "task": "function-test",
      "relation": "not-function"
    },
    {
      "task": "function-test",
      "relation": "function"
    }
  ],
  "systems-equations-worksheets": [
    {
      "method": "general"
    },
    {
      "method": "parallel"
    },
    {
      "method": "coincident"
    },
    {
      "method": "simple",
      "solutions": "positive"
    }
  ]
};
const newTopics=Object.keys(variants);

test('R48: independent export math oracle covers 36 active topics, retaining all 23 from R47',()=>{
 assert.ok(VERIFIED_AT_PDF_BOUNDARY.length>=36,'R48 original 36 must remain verified');
 for(const topic of newTopics)assert.ok(VERIFIED_AT_PDF_BOUNDARY.includes(topic),topic);
});
test('R48: 13 additional maths families and all major options pass independent runtime recomputation',()=>{
 let total=0;
 for(const [topic,choices] of Object.entries(variants))
  for(const options of [{},...choices])
   for(const difficulty of ['easy','standard','challenge'])
    for(let seed=1;seed<=90;seed++){
     const p=sampleProblem(topic,seed,difficulty,options);
     assert.ok(p.payload.question&&p.expectedAnswer);
     const sheet=makeWorksheet(topic,seed,4,difficulty,options);
     assertWorksheetMath(sheet);
     total+=sheet.problems.length;
    }
 assert.ok(total>=22000,'Insufficient R48 option coverage: '+total);
});
test('R48: corrupt both matching answer fields and reject actual PDF export',async()=>{
 for(const [topic,choices] of Object.entries(variants)){
  const sheet=makeWorksheet(topic,20261105,8,'standard',choices[0]);
  const wrong={...sheet,problems:sheet.problems.map((p,i)=>i? p:{...p,expectedAnswer:'INVALID_ANSWER'}),
   answerMap:sheet.answerMap.map((a,i)=>i?a:{...a,answer:'INVALID_ANSWER'})};
  assert.doesNotThrow(()=>assertWorksheetIntegrity(wrong));
  assert.throws(()=>assertWorksheetMath(wrong),/Math oracle:/,topic);
  await assert.rejects(createWorksheetPdf(wrong,topic,'questions','A4'),/Math oracle:/,topic);
 }
});
test('R48: diagram corruption on plotting and angular topics fails closed',()=>{
 for(const topic of [
  'number-line-worksheets','number-recognition-worksheets',
  'triangle-angle-sum-worksheets','complementary-supplementary-angles-worksheets',
  'vertical-angles-worksheets','angle-worksheets','box-plots-worksheets',
  'scatter-plot-worksheets','slope-worksheets']){
  const option=variants[topic].find(o=>!(topic==='number-recognition-worksheets'&&o.task==='word-to-numeral'))??{};
  const sheet=makeWorksheet(topic,20261105,8,'standard',option);
  const first=sheet.problems[0],diagram=first.diagramSpec;
  assert.ok(diagram,topic+' requires a diagram');
  const corrupted={...sheet,problems:[{...first,diagramSpec:{
   ...diagram,values:diagram.values.map((v,i)=>i===0?v+100:v)}},...sheet.problems.slice(1)]};
  assert.throws(()=>assertWorksheetMath(corrupted),/Math oracle:/,topic);
 }
});
test('R48: 13 new topics still print actual A4/Letter math-checked PDFs',async()=>{
 for(const [topic,choices] of Object.entries(variants)){
  const sheet=makeWorksheet(topic,20261105,8,'standard',choices[0]);
  for(const paper of ['A4','Letter']){
   const bytes=await createWorksheetPdf(sheet,topic,'questions',paper);
   const doc=await PDFDocument.load(bytes);
   assert.ok(doc.getPageCount()>=1&&doc.getTitle().includes(sheet.optionsHash));
  }
 }
});
