/** R77: actual frequency dot plot PDF evidence for all five skills plus
 * mixed, both paper sizes and student/teacher/worked versions.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createDotPlotPack} from '../src/lib/statistical-dot-plot.ts';
import {createDotPlotPdf} from '../src/lib/statistical-dot-plot-pdf.ts';
const folder='qa-artifacts/r77-statistical-dot-plots';
await mkdir(folder,{recursive:true});
const documents=[];
for(const task of ['mixed','plot','frequency','mode','median','range']){
 for(const paper of ['Letter','A4']){
  const pack=createDotPlotPack('mean-median-mode-range-worksheets',20261106,8,'standard',task);
  for(const output of ['questions','answers','steps']){
   const file='dotplot-'+task+'-'+paper+'-'+output+'.pdf';
   await writeFile(join(folder,file),await createDotPlotPdf(pack,output,paper));
   documents.push({file,task,paper,output,seed:pack.seed,quantity:pack.quantity,
    problems:pack.problems});
  }
 }
}
if(documents.length!==36)throw Error('R77 must export exactly 36 actual PDF fixtures');
await writeFile(join(folder,'manifest.json'),JSON.stringify({
 schema:'mathworks-r77-frequency-dot-plot-pdfs/v1',documents,
 original488KeywordsModified:false,noNewSeoKeywordClaim:true,teacherReview:'NOT RUN',physicalPrinting:'NOT RUN'
},null,2)+'\n');
console.log('R77: 36 authentic frequency-dot-plot PDFs generated with independent question manifests.');
