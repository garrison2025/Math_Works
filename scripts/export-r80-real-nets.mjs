/** R80 inspectable vector evidence: nine seeded modes, both paper sizes,
 * all student/teacher/worked editions; 54 original PDF files total.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createR80Pack} from '../src/lib/r80-area-nets-pack.ts';
import {createR80Pdf} from '../src/lib/r80-area-nets-pdf.ts';
const dir='qa-artifacts/r80-true-net-composite-area';
await mkdir(dir,{recursive:true});
const skills=[
 ['nets','mixed'],['nets','rectangular-prism'],['nets','triangular-prism'],
 ['nets','cylinder'],['nets','square-pyramid'],['nets','regular-tetrahedron'],
 ['composite','mixed'],['composite','left-step'],['composite','right-step']
];
const documents=[];
for(const [skill,mode] of skills)for(const paper of ['A4','Letter']){
 const pack=createR80Pack(20261107,8,'standard',skill,mode);
 for(const output of ['questions','answers','steps']){
  const file='r80-'+skill+'-'+mode+'-'+paper+'-'+output+'.pdf';
  await writeFile(join(dir,file),await createR80Pdf(pack,output,paper));
  documents.push({file,skill,mode,paper,output,seed:pack.seed,
   quantity:pack.quantity,problems:pack.problems});
 }
}
if(documents.length!==54)throw Error('R80 requires 54 real user-size PDF fixtures');
await writeFile(join(dir,'manifest.json'),JSON.stringify({
 schema:'mathworks-r80-true-nets-composite/v1',documents,original488Edited:false,
 printerCalibrated:false,teacherApproved:false,cloudflareLiveSHA:'NOT VERIFIED',
 previewRobots:'noindex,nofollow'
},null,2)+'\n');
console.log('R80: exported 54 original unfolded/net/composite PDFs for both page sizes.');
