/** Export reproducible original vector PDFs and a separate math manifest for
 * the R74 Python PDF-content audit. No screenshots or server-side generation.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createInequalityPracticePack} from '../src/lib/inequality-practice.ts';
import {createCircleAreaPack} from '../src/lib/circle-area-practice.ts';
import {createR74PracticePdf} from '../src/lib/r74-practice-pdf.ts';
const dir='qa-artifacts/r74-inequality-circle';
await mkdir(dir,{recursive:true});
const rows=[];
for(const kind of ['inequality','circle']){
 const modes=kind==='inequality'?['mixed','translate','and','or']:
  ['mixed','radius','diameter','semicircle','quarter-circle','sector','missing-radius'];
 for(const mode of modes)for(const paper of ['Letter','A4']){
  const pack=kind==='inequality'?
   createInequalityPracticePack('inequalities-worksheets',20261106,8,'standard',mode):
   createCircleAreaPack('area-worksheets',20261106,8,'standard',mode);
  for(const output of ['questions','answers','steps']){
   const name=kind+'-'+mode+'-'+paper+'-'+output+'.pdf';
   const pdf=await createR74PracticePdf(pack,output,paper);
   await writeFile(join(dir,name),pdf);
   rows.push({file:name,kind,mode,paper,output,
    version:pack.version,seed:pack.seed,quantity:pack.quantity,problems:pack.problems});
  }
 }
}
await writeFile(join(dir,'manifest.json'),JSON.stringify({schema:'mathworks-r74-printed-math-audit/v1',
 source:'original generated pack, independently recomputed in Python audit',files:rows},null,2)+'\n');
console.log('R74 '+rows.length+' real vector PDFs generated with exact teacher/student pair manifest.');
