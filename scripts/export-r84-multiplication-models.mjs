/** R84 original inspectable A4/Letter student/teacher/step vector fixtures. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createMultiplicationModelPack} from '../src/lib/multiplication-models.ts';
import {createMultiplicationModelPdf} from '../src/lib/multiplication-models-pdf.ts';
const dir='qa-artifacts/r84-multiplication-visual-stories';
await mkdir(dir,{recursive:true});
const documents=[];
for(const practice of ['mixed','arrays','number-line','stories'])
for(const paper of ['A4','Letter']){
 const pack=createMultiplicationModelPack(20261107,8,'standard',practice);
 for(const output of ['questions','answers','steps']){
  const file='r84-'+practice+'-'+paper+'-'+output+'.pdf';
  await writeFile(join(dir,file),await createMultiplicationModelPdf(pack,output,paper,'standard'));
  documents.push({file,practice,paper,output,problems:pack.problems,seed:pack.seed});
 }
}
if(documents.length!==24)throw Error('Expected 24 student, key and worked math PDFs');
await writeFile(join(dir,'manifest.json'),JSON.stringify({
 schema:'mathworks-r84-visual-multiplication/v1',documents,
 approvedForGoogleIndexing:false,teacherApproved:false,physicalPrintScale:'NOT RUN',
 original488Changed:false,originalV18Changed:false},null,2)+'\n');
console.log('R84 exported 24 A4/Letter vector multiplication worksheets.');
