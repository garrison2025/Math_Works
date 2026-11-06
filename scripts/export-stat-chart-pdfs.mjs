/** R58 printed modified-box-scale samples for independent PDF inspection. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
const dir='qa-artifacts/stat-chart-pdfs';
await mkdir(dir,{recursive:true});
const manifest={schema:'mathworks-r58-box-scale/v1',generatorVersion:null,documents:[],physicalPrint:'NOT MEASURED'};
// Actively select both cases with and without statistically valid outliers.
// Arbitrary chosen seeds formerly happened to cover no actual outlier circles.
const fixtures=[];
for(let seed=1;seed<=1000&&fixtures.length<4;seed++){
 const worksheet=makeWorksheet('box-plots-worksheets',seed,1,'standard',{statistic:'draw'});
 const hasOutliers=!worksheet.problems[0].expectedAnswer.endsWith('outliers=none');
 if(fixtures.filter(f=>f.hasOutliers===hasOutliers).length<2)
  fixtures.push({seed,worksheet,hasOutliers});
}
if(fixtures.length!==4||fixtures.filter(f=>f.hasOutliers).length!==2)
 throw Error('Cannot generate two outlier and two no-outlier PDF oracle cases');
for(const [i,{seed,worksheet,hasOutliers}] of fixtures.entries()){
 manifest.generatorVersion??=worksheet.generatorVersion;
 const raw=worksheet.problems[0].diagramSpec.values;
 for(const paper of ['A4','Letter'])for(const mode of ['questions','answers']){
  const file=`box-${i+1}-${paper.toLowerCase()}-${mode}.pdf`;
  await writeFile(join(dir,file),await createWorksheetPdf(worksheet,'Box and Whisker Plots',mode,paper));
  manifest.documents.push({file,paper,mode,raw,seed,hasOutliers,answer:worksheet.problems[0].expectedAnswer});
 }
}
await writeFile(join(dir,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('R58 16 actual A4/Letter practice and answer box-scale PDFs exported');
