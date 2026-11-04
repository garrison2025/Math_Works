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
 {slug:'two-digit-multiplication-worksheets',quantity:20,options:{factorRange:'small'}},
 {slug:'long-division-worksheets',quantity:20,options:{remainder:'yes'}},
 {slug:'three-digit-by-two-digit-multiplication-worksheets',quantity:20,options:{multiplierRange:'high'}},
 {slug:'box-plots-worksheets',quantity:8,options:{statistic:'Q1'}},
 {slug:'printable-protractor',quantity:4,options:{angleRange:'acute'}},
 {slug:'linear-equations-worksheets',quantity:8,options:{slope:'negative'}}
];
const files=[];
for(const [index,item] of fixtures.entries()){
 const set=makeWorksheet(item.slug,20261104+index,item.quantity,'standard',item.options);
 for(const paper of ['Letter','A4'])for(const mode of ['questions','answers',...(hasVerifiedSteps(item.slug)?['steps']:[])]){
  const name=`${item.slug}-${paper.toLowerCase()}-${mode}.pdf`;
  const bytes=await createWorksheetPdf(set,titleFor(item.slug),mode,paper);
  await writeFile(join(directory,name),bytes);
  files.push({name,topic:item.slug,mode,paper,seed:set.seed,config:set.optionsHash,questionCount:set.problems.length});
 }
}
await writeFile(join(directory,'manifest.json'),JSON.stringify({source:'R11 deterministic golden fixtures',files},null,2));
console.log(`Generated ${files.length} PDF QA fixtures to ${directory}`);
