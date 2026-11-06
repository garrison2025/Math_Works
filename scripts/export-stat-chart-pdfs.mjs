/** R58 printed modified-box-scale samples for independent PDF inspection. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
const dir='qa-artifacts/stat-chart-pdfs';
await mkdir(dir,{recursive:true});
const manifest={schema:'mathworks-r58-box-scale/v1',generatorVersion:null,documents:[],physicalPrint:'NOT MEASURED'};
for(const [i,seed] of [1,17,30,44].entries()){
 const worksheet=makeWorksheet('box-plots-worksheets',seed,1,'standard',{statistic:'draw'});
 manifest.generatorVersion??=worksheet.generatorVersion;
 const raw=worksheet.problems[0].diagramSpec.values;
 for(const paper of ['A4','Letter'])for(const mode of ['questions','answers']){
  const file=`box-${i+1}-${paper.toLowerCase()}-${mode}.pdf`;
  await writeFile(join(dir,file),await createWorksheetPdf(worksheet,'Box and Whisker Plots',mode,paper));
  manifest.documents.push({file,paper,mode,raw,seed,answer:worksheet.problems[0].expectedAnswer});
 }
}
await writeFile(join(dir,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('R58 16 actual A4/Letter practice and answer box-scale PDFs exported');
