/** R86: 24 individually inspectable vector function-graph PDFs plus a source manifest. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {GRAPH_MODES,createGraphPack} from '../src/lib/r86-function-graphs.ts';
import {createGraphPdf} from '../src/lib/r86-function-graphs-pdf.ts';
const dir='qa-artifacts/r86-real-function-graphs';
await mkdir(dir,{recursive:true});
const manifest=[];
for(const mode of GRAPH_MODES){
 const pack=createGraphPack(20261107,8,'standard',mode);
 for(const paper of ['A4','Letter'])for(const edition of ['questions','answers','steps']){
  const file='r86-'+mode+'-'+edition+'-'+paper+'.pdf';
  await writeFile(join(dir,file),await createGraphPdf(pack,edition,paper));
  manifest.push({file,mode,paper,edition,seed:pack.seed,problems:pack.problems});
 }
}
if(manifest.length!==24)throw Error('R86 must export 24 actual sample PDFs');
await writeFile(join(dir,'manifest.json'),JSON.stringify({schema:'mathworks-r86-coordinate-graphs/v1',
 samples:manifest,topic:'functions-worksheets',originalV18Untouched:true,
 imported488KeywordsUntouched:true,teacherReview:'NOT RUN',physicalPrint:'NOT RUN',
 seoIndexApproved:false},null,2)+'\n');
console.log('R86 exported 24 A4/Letter vector graph student, teacher and steps sample PDFs.');
