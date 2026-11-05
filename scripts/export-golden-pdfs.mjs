/** GitHub Actions quality-evidence exporter. Generated files are build artifacts,
 * not committed SEO pages, and remain excluded from the public site bundle. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
import {hasVerifiedSteps} from '../src/lib/capabilities.ts';
import {titleFor} from '../src/lib/site.ts';
const directory='qa-artifacts/pdf-samples';
await mkdir(directory,{recursive:true});
const fixtures=[
 {slug:'two-step-equations-worksheets',quantity:20,options:{coefficient:'negative'}},
 {slug:'adding-unlike-fractions-worksheets',quantity:20,options:{sumType:'proper'}},
 {slug:'fractions-worksheets',quantity:20,options:{operation:'division',denominators:'unlike'}},
 {slug:'fractions-worksheets',quantity:20,options:{operation:'subtraction',denominators:'unlike'}},
 {slug:'two-digit-multiplication-worksheets',quantity:20,options:{factorRange:'small'}},
 {slug:'long-division-worksheets',quantity:20,options:{remainder:'yes'}},
 {slug:'three-digit-by-two-digit-multiplication-worksheets',quantity:20,options:{multiplierRange:'high'}},
 {slug:'box-plots-worksheets',quantity:8,options:{statistic:'Q1'}},
 {slug:'box-plots-worksheets',quantity:8,options:{statistic:'draw'}},
 {slug:'scatter-plot-worksheets',quantity:8,options:{task:'plot',trend:'mixed'}},
 {slug:'scatter-plot-worksheets',quantity:4,options:{task:'identify',trend:'none'}},
 {slug:'printable-protractor',quantity:4,options:{angleRange:'acute'}},
 {slug:'linear-equations-worksheets',quantity:8,options:{slope:'negative'}},
 {slug:'linear-equations-worksheets',quantity:8,options:{slope:'positive',task:'graph'}},
 {slug:'linear-equations-worksheets',quantity:8,options:{slope:'negative',task:'graph'}},
 {slug:'linear-equations-worksheets',quantity:8,options:{slope:'zero',task:'graph'}},
 {slug:'triangle-angle-sum-worksheets',quantity:8,options:{thirdAngle:'obtuse'}},
 {slug:'area-of-trapezoids-worksheets',quantity:8,options:{task:'missing-height'}},
 {slug:'area-of-triangles-worksheets',quantity:8,options:{task:'missing-height'}},
 {slug:'volume-of-rectangular-prisms-worksheets',quantity:8,options:{task:'missing-height'}},
 {slug:'vertical-angles-worksheets',quantity:8,options:{task:'adjacent'}},
 {slug:'area-worksheets',quantity:8,options:{shape:'square'}},
 {slug:'surface-area-worksheets',quantity:8,options:{solid:'cube'}},
 {slug:'lines-rays-segments-worksheets',quantity:8,options:{figure:'mixed'}},
 {slug:'systems-equations-worksheets',quantity:8,options:{method:'parallel',solutions:'mixed'}},
 {slug:'systems-equations-worksheets',quantity:8,options:{method:'coincident',solutions:'mixed'}},
 {slug:'domain-range-worksheets',quantity:8,options:{task:'function-test',relation:'not-function'}},
 {slug:'pythagorean-worksheets',quantity:8,options:{scale:'small',task:'missing-leg'}},
 {slug:'pythagorean-worksheets',quantity:8,options:{scale:'large',task:'mixed'}},
 {slug:'function-tables-worksheets',quantity:8,options:{task:'input',missing:'middle'}},
 {slug:'function-tables-worksheets',quantity:8,options:{task:'output',missing:'first'}},
 {slug:'mean-median-mode-range-worksheets',quantity:20,options:{statistic:'mode',modePattern:'two'}},
 {slug:'mean-median-mode-range-worksheets',quantity:20,options:{statistic:'mode',modePattern:'none'}},
 {slug:'mean-median-mode-range-worksheets',quantity:20,options:{statistic:'mean',modePattern:'mixed'}},
 {slug:'mean-absolute-deviation-worksheets',quantity:20,options:{distribution:'symmetric',size:'5'}},
 {slug:'mean-absolute-deviation-worksheets',quantity:20,options:{distribution:'skewed',size:'6'}},
 {slug:'mean-absolute-deviation-worksheets',quantity:20,options:{distribution:'skewed',size:'8'}},
 {slug:'percentages-worksheets',quantity:20,options:{direction:'percent-of-number'}},
 {slug:'percentages-worksheets',quantity:20,options:{direction:'percent-change'}},
 {slug:'scientific-notation-worksheets',quantity:20,options:{direction:'to-standard',exponentSign:'negative',significantDigits:'4'}},
 {slug:'scientific-notation-worksheets',quantity:20,options:{direction:'to-scientific',exponentSign:'positive',significantDigits:'3'}}
];
const files=[];
for(const [index,item] of fixtures.entries()){
 const set=makeWorksheet(item.slug,20261104+index,item.quantity,'standard',item.options);
 for(const paper of ['Letter','A4'])for(const mode of ['questions','answers',...(hasVerifiedSteps(item.slug)?['steps']:[])]){
  const name=`${item.slug}-${String(index+1).padStart(2,'0')}-${paper.toLowerCase()}-${mode}.pdf`;
  const bytes=await createWorksheetPdf(set,titleFor(item.slug),mode,paper);
  await writeFile(join(directory,name),bytes);
  files.push({name,topic:item.slug,mode,paper,seed:set.seed,config:set.optionsHash,questionCount:set.problems.length});
 }
}
await writeFile(join(directory,'manifest.json'),JSON.stringify({source:'R25 deterministic golden fixtures',files},null,2));
console.log(`Generated ${files.length} PDF QA fixtures to ${directory}`);
