/** R76 exact cylinder student/key/steps PDFs. The audit inspects the
 * physically emitted rectangle lengths and disk geometry, not just source math.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createCylinderPack} from '../src/lib/cylinder-pack.ts';
import {createCylinderPdf} from '../src/lib/cylinder-pdf.ts';
const dir='qa-artifacts/r76-cylinder-net';
await mkdir(dir,{recursive:true});
const files=[];
for(const mode of ['mixed','total-surface','lateral-surface','volume','surface-and-volume'])
 for(const paper of ['Letter','A4']){
  const pack=createCylinderPack('surface-area-worksheets',20261106,8,'standard',mode);
  for(const output of ['questions','answers','steps']){
   const file='cylinder-'+mode+'-'+paper+'-'+output+'.pdf';
   const bytes=await createCylinderPdf(pack,output,paper);
   await writeFile(join(dir,file),bytes);
   files.push({file,mode,paper,output,seed:pack.seed,quantity:pack.quantity,
    version:pack.version,problems:pack.problems});
  }
 }
await writeFile(join(dir,'manifest.json'),JSON.stringify({schema:'r76-cylinder-true-vector-audit/v1',
 files},null,2)+'\n');
console.log('R76 exported '+files.length+' actual cylinder net PDFs with exact pi math.');
