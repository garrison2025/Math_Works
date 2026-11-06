/** R68 complete A4/Letter math and print evidence: every actual PDF output
 * plus exact generated question rows for independent Python re-evaluation.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createDecimalAddSubPack} from '../src/lib/decimal-add-sub.ts';
import {createDecimalAddSubPdf} from '../src/lib/decimal-add-sub-pdf.ts';
const folder='qa-artifacts/r68-decimal-add-sub';await mkdir(folder,{recursive:true});
const cases=[];
for(const operation of ['addition','subtraction','mixed'])
 for(const precision of ['tenths','hundredths'])
  for(const paper of ['A4','Letter']){
   const pack=createDecimalAddSubPack('subtraction-worksheets',20261106,8,'standard',operation,precision,'mixed');
   for(const mode of ['questions','answers','steps']){
    const file='decimal-columns-'+operation+'-'+precision+'-'+paper.toLowerCase()+'-'+mode+'.pdf';
    const bytes=await createDecimalAddSubPdf(pack,mode,paper);
    await writeFile(join(folder,file),bytes);
    cases.push({file,paper,operation,precision,mode,seed:pack.seed,
     questions:pack.questions.map(q=>({...q}))});
   }
  }
await writeFile(join(folder,'r68-pdf-fixtures.json'),JSON.stringify(cases,null,2)+'\n');
console.log('R68: exported '+cases.length+' real decimal point aligned PDF student/key/steps samples');
