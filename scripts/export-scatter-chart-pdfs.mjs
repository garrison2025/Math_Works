/** R59: real A4/Letter PDF charts covering all scatter tasks and trends.
 * Each file contains one diagram to permit independent vector-level inspection.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';

const folder='qa-artifacts/scatter-chart-pdfs';
await mkdir(folder,{recursive:true});
const manifest={schema:'mathworks-r59-scatter-vector/v1',documents:[],
 generatorVersion:null,teacherApproval:'NOT REVIEWED',physicalPrinter:'NOT MEASURED'};
let index=0;
for(const trend of ['positive','negative','none'])
 for(const task of ['identify','plot']){
  const options={task,trend};
  const seed=20261106+index++*13;
  const sheet=makeWorksheet('scatter-plot-worksheets',seed,1,'standard',options);
  manifest.generatorVersion??=sheet.generatorVersion;
  const problem=sheet.problems[0],raw=problem.diagramSpec.values;
  if(problem.diagramSpec.kind!=='scatter'||raw.length!==12)throw Error('Missing six-pair scatter diagram');
  const pairs=Array.from({length:6},(_,i)=>[raw[2*i],raw[2*i+1]]);
  for(const paper of ['A4','Letter'])
   for(const mode of task==='plot'?['questions','answers']:['questions']){
    const filename=`scatter-${task}-${trend}-${paper.toLowerCase()}-${mode}.pdf`;
    await writeFile(join(folder,filename),await createWorksheetPdf(sheet,'Scatter Plot Worksheets',mode,paper));
    manifest.documents.push({file:filename,paper,mode,task,trend,seed,
     pairs,question:problem.payload.question,answer:problem.expectedAnswer,
     expectedDots:task==='identify'||mode==='answers'?6:0});
   }
 }
if(manifest.documents.length!==18)throw Error('Incomplete scatter combinations');
await writeFile(join(folder,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('R59 exported 18 A4/Letter scatter charts, including blank plotting grids and solved answer sheets');
