/** R66: reproduce real PDF vector fixtures for third-party inspection. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createFractionLinePack} from '../src/lib/fraction-number-lines.ts';
import {createFractionLinePdf} from '../src/lib/fraction-number-line-pdf.ts';
const folder='qa-artifacts/r66-fraction-number-lines';await mkdir(folder,{recursive:true});
const cases=[];
for(const topic of ['number-line-worksheets','fractions-worksheets'])
 for(const task of ['identify','plot'])
  for(const range of ['zero-one','zero-two'])
   for(const paper of ['A4','Letter']){
    const pack=createFractionLinePack(topic,20261106,8,'standard',task,range);
    for(const mode of ['questions','answers']){
     const filename='fraction-number-line-'+topic+'-'+task+'-'+range+'-'+paper.toLowerCase()+'-'+mode+'.pdf';
     const bytes=await createFractionLinePdf(pack,mode,paper);
     await writeFile(join(folder,filename),bytes);
     cases.push({filename,topic,task,range,paper,mode,questionCount:pack.questions.length,
      questions:pack.questions.map(({numerator,denominator,answer,reducedAnswer,prompt})=>({
       numerator,denominator,answer,reducedAnswer,prompt
      }))});
    }
   }
await writeFile(join(folder,'r66-vector-fixtures.json'),JSON.stringify(cases,null,2)+'\n');
console.log('R66 exported '+cases.length+' real vector PDFs with 8 questions and per-task source manifest.');
