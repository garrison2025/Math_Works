/** R67 real vector-PDF export for third-party math and print audit. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createDecimalDivisionPack} from '../src/lib/decimal-division.ts';
import {createDecimalDivisionPdf} from '../src/lib/decimal-division-pdf.ts';
const folder='qa-artifacts/r67-decimal-division';
await mkdir(folder,{recursive:true});
const manifest=[];
for(const divisorMode of ['whole','decimal'])
 for(const precisionMode of ['tenths','hundredths'])
  for(const paper of ['A4','Letter']){
   const pack=createDecimalDivisionPack('division-worksheets',20261106,8,'standard',divisorMode,precisionMode);
   for(const mode of ['questions','answers','steps']){
    const filename='decimal-division-'+divisorMode+'-'+precisionMode+'-'+paper.toLowerCase()+'-'+mode+'.pdf';
    const bytes=await createDecimalDivisionPdf(pack,mode,paper);
    await writeFile(join(folder,filename),bytes);
    manifest.push({filename,seed:pack.seed,divisorMode,precisionMode,
     paper,mode,questions:pack.questions.map(q=>({...q}))});
   }
  }
await writeFile(join(folder,'r67-pdf-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('R67 exported '+manifest.length+' authentic decimal division A4/Letter student, answer and worked-step PDFs');
