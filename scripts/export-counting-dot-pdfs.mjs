/** R59: twelve observed-count diagrams, two paper sizes, true PDF vectors.
 * This checks existing count-the-dots number-recognition illustrations,
 * NOT a new statistical frequency-dot-plot generator or new SEO URL.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {makeWorksheet,sampleProblem} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';

const output='qa-artifacts/counting-dot-pdfs';
await mkdir(output,{recursive:true});
const chosen=new Map();
for(let seed=1;seed<=2000&&chosen.size<12;seed++){
 const p=sampleProblem('number-recognition-worksheets',seed,'standard',{task:'count-dots'});
 if(p.diagramSpec.kind!=='dots')throw Error('count-dots lacks diagram');
 const count=Number(p.expectedAnswer);
 if(count>=1&&count<=12&&!chosen.has(count))chosen.set(count,seed);
}
if(chosen.size!==12)throw Error('The integer 1..12 dot count catalog is incomplete');
const manifest={schema:'mathworks-r59-counting-dot-pdf/v1',
 documents:[],physicalPrinter:'NOT MEASURED',teacherSignoff:'NOT REVIEWED'};
for(const [count,seed] of [...chosen.entries()].sort((a,b)=>a[0]-b[0])){
 const sheet=makeWorksheet('number-recognition-worksheets',seed,1,'standard',{task:'count-dots'});
 if(sheet.problems[0].diagramSpec.values[0]!==count||Number(sheet.problems[0].expectedAnswer)!==count)
  throw Error('Counting-dot source diagram and answer disagree');
 for(const paper of ['A4','Letter']){
  const file=`count-${String(count).padStart(2,'0')}-${paper.toLowerCase()}.pdf`;
  await writeFile(join(output,file),await createWorksheetPdf(sheet,'Number Recognition Worksheets','questions',paper));
  manifest.documents.push({file,paper,count,seed,answer:sheet.problems[0].expectedAnswer});
 }
}
if(manifest.documents.length!==24)throw Error('Missing counting dot A4/Letter PDFs');
await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('R59 exported all counts 1..12 on both A4 and Letter, 24 true vector PDFs');
