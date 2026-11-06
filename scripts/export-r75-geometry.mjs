/** R75 reproducible true PDF evidence, all triangle and L-area modes.
 * Each file contains eight actual problem statements and the same seed/order.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createTrianglePack} from '../src/lib/triangle-inequality-pack.ts';
import {createCompositePack} from '../src/lib/composite-area-pack.ts';
import {createR75GeometryPdf} from '../src/lib/r75-geometry-pdf.ts';
const dir='qa-artifacts/r75-triangle-composite';
await mkdir(dir,{recursive:true});
const evidence=[];
for(const topic of ['triangle','composite']){
 const modes=topic==='triangle'?['mixed','possible','missing-side','integer-count']:
  ['mixed','subtract','split'];
 for(const skill of modes)for(const paper of ['Letter','A4']){
  const pack=topic==='triangle'?createTrianglePack('inequalities-worksheets',20261106,8,'standard',skill):
   createCompositePack('area-worksheets',20261106,8,'standard',skill);
  for(const output of ['questions','answers','steps']){
   const file=topic+'-'+skill+'-'+paper+'-'+output+'.pdf';
   const bytes=await createR75GeometryPdf(pack,output,paper);
   await writeFile(join(dir,file),bytes);
   evidence.push({file,topic,skill,paper,output,seed:pack.seed,quantity:pack.quantity,
    version:pack.version,problems:pack.problems});
  }
 }
}
await writeFile(join(dir,'manifest.json'),JSON.stringify({schema:'mathworks-r75-print-oracle/v1',
 evidence},null,2)+'\n');
console.log('R75 exported '+evidence.length+' actual vector PDFs: two paper formats, all modes, student/key/steps.');
