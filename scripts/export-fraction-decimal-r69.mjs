/** R69 real A4/Letter fraction decimal conversion PDFs for independent
 * geometry/content inspection. Each source manifest records exact math.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createFractionDecimalPack} from '../src/lib/fraction-decimal-conversion.ts';
import {createFractionDecimalPdf} from '../src/lib/fraction-decimal-conversion-pdf.ts';
const folder='qa-artifacts/r69-fraction-decimal-conversion';
await mkdir(folder,{recursive:true});
const cases=[];
for(const direction of ['fraction-to-decimal','decimal-to-fraction','mixed'])
 for(const precision of ['tenths','hundredths','thousandths'])
  for(const paper of ['A4','Letter']){
   const pack=createFractionDecimalPack('fractions-worksheets',20261106,8,'standard',direction,precision);
   for(const mode of ['questions','answers','steps']){
    const filename='fraction-decimal-'+direction+'-'+precision+'-'+paper.toLowerCase()+'-'+mode+'.pdf';
    const bytes=await createFractionDecimalPdf(pack,mode,paper);
    await writeFile(join(folder,filename),bytes);
    cases.push({filename,direction,precision,paper,mode,seed:pack.seed,
     questions:pack.questions.map(q=>({...q}))});
   }
  }
await writeFile(join(folder,'r69-conversion-fixtures.json'),JSON.stringify(cases,null,2)+'\n');
console.log('R69 generated '+cases.length+' real print-ready fraction/decimal student/answer/steps PDFs.');
