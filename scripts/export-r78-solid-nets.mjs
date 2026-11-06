/** R78 real PDF evidence: 36 actual vector files, tested independently. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createSolidPack} from '../src/lib/prism-pyramid-pack.ts';
import {createSolidPdf} from '../src/lib/prism-pyramid-pdf.ts';
const folder='qa-artifacts/r78-prism-pyramid-nets';
await mkdir(folder,{recursive:true});
const packs=[
 ['volume-of-rectangular-prisms-worksheets','mixed'],
 ['volume-of-rectangular-prisms-worksheets','triangular-prism-volume'],
 ['surface-area-worksheets','mixed'],
 ['surface-area-worksheets','triangular-prism-surface'],
 ['surface-area-worksheets','square-pyramid-surface'],
 ['surface-area-worksheets','regular-tetrahedron-surface']
];
const documents=[];
for(const [topic,skill] of packs)for(const paper of ['Letter','A4']){
 const pack=createSolidPack(topic,20261106,8,'standard',skill);
 for(const output of ['questions','answers','steps']){
  const label=topic.startsWith('volume')?'volume':'area';
  const file='solid-'+label+'-'+skill+'-'+paper+'-'+output+'.pdf';
  const bytes=await createSolidPdf(pack,output,paper);
  await writeFile(join(folder,file),bytes);
  documents.push({file,topic,skill,paper,output,seed:pack.seed,
   quantity:pack.quantity,version:pack.version,problems:pack.problems});
 }
}
if(documents.length!==36)throw Error('R78 must export exactly 36 distinct solid sample PDFs');
await writeFile(join(folder,'manifest.json'),JSON.stringify({
 schema:'mathworks-r78-exact-proportional-solid-nets/v1',documents,
 teacherReviewed:false,physicalPrintMeasured:false,source488Edited:false,
 previewRobots:'noindex,nofollow'
},null,2)+'\n');
console.log('R78: exported 36 actual right prism, right square pyramid, regular tetrahedron PDF artifacts.');
