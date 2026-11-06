/** R79 48 genuine same-sheet mixed prism-cylinder PDF fixtures, all 3 real
 * solid nets, 2 distinct tasks, 2 physical paper sizes and 3 output variants.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createMixedSolidPack} from '../src/lib/mixed-prism-cylinder-pack.ts';
import {createMixedSolidPdf} from '../src/lib/mixed-prism-cylinder-pdf.ts';
const root='qa-artifacts/r79-mixed-prisms-cylinders';
await mkdir(root,{recursive:true});
const records=[];
for(const topic of ['volume-of-rectangular-prisms-worksheets','surface-area-worksheets'])
 for(const mode of ['mixed','rectangular-prism','triangular-prism','cylinder'])
 for(const paper of ['A4','Letter']){
  const pack=createMixedSolidPack(topic,20261107,8,'standard',mode);
  for(const output of ['questions','answers','steps']){
   const file='mixed-'+pack.task+'-'+mode+'-'+paper+'-'+output+'.pdf';
   await writeFile(join(root,file),await createMixedSolidPdf(pack,output,paper));
   records.push({file,task:pack.task,topic,paper,mode,output,
    problems:pack.problems,quantity:pack.quantity,seed:pack.seed});
  }
 }
if(records.length!==48)throw Error('Expected 48 complete mixed volume and surface-area PDFs');
await writeFile(join(root,'manifest.json'),JSON.stringify({
 schema:'mathworks-r79-mixed-solid-pdf-v1',documents:records,
 oldV18Modified:false,ownerKeywordCSVModified:false,teacherReview:'NOT RUN',physicalPrint:'NOT RUN'
},null,2)+'\n');
console.log('R79: 48 mixed-prisms-cylinders PDF samples created with exact shape and key manifests.');
