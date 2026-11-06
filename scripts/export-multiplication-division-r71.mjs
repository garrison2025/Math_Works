/** R71 source-matched exact student, teacher and worked-step PDF fixtures.
 * Export true PDF bytes plus every seeded exercise to independently audit
 * actual visible math and grid geometry through Python PyMuPDF.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createMultDivisionPack} from '../src/lib/multiplication-division-practice.ts';
import {createMultDivisionPdf} from '../src/lib/multiplication-division-practice-pdf.ts';
const output='qa-artifacts/r71-multiplication-division';
await mkdir(output,{recursive:true});
const manifest=[];
for(const topic of ['multiplication-worksheets','division-worksheets']){
 for(const practiceMode of topic==='multiplication-worksheets'?
  ['mixed-facts','fact-family','area-model']:['mixed-facts','fact-family']){
  for(const paper of ['A4','Letter']){
   const pack=createMultDivisionPack(topic,20261106,8,'standard',practiceMode,'mixed');
   for(const mode of ['questions','answers','steps']){
    const filename=topic+'-'+practiceMode+'-'+paper.toLowerCase()+'-'+mode+'.pdf';
    const bytes=await createMultDivisionPdf(pack,mode,paper);
    await writeFile(join(output,filename),bytes);
    manifest.push({filename,topic,practiceMode,paper,mode,
     seed:pack.seed,quantity:pack.quantity,
     questions:pack.questions.map(q=>({...q}))});
   }
  }
 }
}
await writeFile(join(output,'r71-multiplication-division-source-fixtures.json'),
 JSON.stringify(manifest,null,2)+'\n');
console.log('R71 exported '+manifest.length+' real student/teacher/steps PDF files with exact fact-family and area-model data.');
