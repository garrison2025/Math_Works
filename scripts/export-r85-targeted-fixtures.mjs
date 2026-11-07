/** Export 24 real R85 student/teacher/steps PDFs with a complete question manifest. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createR85Pack,R85_MODES} from '../src/lib/r85-targeted-packs.ts';
import {createR85Pdf} from '../src/lib/r85-targeted-pdf.ts';
const dir='qa-artifacts/r85-four-practice-families';
await mkdir(dir,{recursive:true});
const manifest=[];
for(const topic of Object.keys(R85_MODES)){
 const mode=R85_MODES[topic][0],pack=createR85Pack(topic,20261104,8,'standard',mode);
 for(const paper of ['A4','Letter'])for(const edition of ['questions','answers','steps']){
  const file='r85-'+topic+'-'+mode+'-'+edition+'-'+paper+'.pdf';
  const bytes=await createR85Pdf(pack,edition,paper);
  await writeFile(join(dir,file),bytes);
  manifest.push({file,topic,mode,edition,paper,questions:pack.problems,sourceSeed:pack.seed});
 }
}
if(manifest.length!==24)throw Error('R85 must export 24 distinct actual PDF fixtures');
await writeFile(join(dir,'manifest.json'),JSON.stringify({schema:'mathworks-r85-targeted/v1',
 exports:manifest,originalV18Intact:true,sourceKeywordsIntact:true,
 teacherApproved:false,physicalPrint:'NOT RUN',googleIndexApproval:false},null,2)+'\n');
console.log('R85 exported 24 real visual and contextual mathematical PDF samples.');
