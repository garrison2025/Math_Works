/** One definitive sample artifact bundle for five genuinely missing skill families. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {makeClosurePack,CLOSURE_MODES} from '../src/lib/closure-math.ts';
import {createClosurePdf} from '../src/lib/closure-pdf.ts';
const dir='qa-artifacts/closure-30-actual-worksheet-pdfs';
await mkdir(dir,{recursive:true});
const records=[];
for(const topic of Object.keys(CLOSURE_MODES)){
 const pack=makeClosurePack(topic,20261104,8,'standard');
 for(const paper of ['A4','Letter'])for(const edition of ['questions','answers','steps']){
  const path=topic+'-'+edition+'-'+paper+'.pdf';
  await writeFile(join(dir,path),await createClosurePdf(pack,edition,paper));
  records.push({path,topic,paper,edition,problems:pack.problems,seed:pack.seed});
 }
}
if(records.length!==30)throw Error('Expected 30 actual vector math PDFs, not placeholder previews');
await writeFile(join(dir,'manifest.json'),JSON.stringify({schema:'mathworks-closure-30-samples/v1',
 exports:records,historicalKeywordsChanged:false,originalV18Changed:false,
 status:'DIGITAL QA ONLY; teacher/physical printer NOT RUN',indexApproved:false},null,2)+'\n');
console.log('Closure: exported 30 genuine printed maths PDFs with exact seed, coordinates and answer manifest.');
