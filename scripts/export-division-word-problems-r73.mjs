/** R73 real A4/Letter division word-problem PDFs with exact manifest
 * for independent evaluation of numbers, narrative and answer units.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createDivisionStoryPack} from '../src/lib/division-word-problems.ts';
import {createDivisionStoryPdf} from '../src/lib/division-word-problems-pdf.ts';
const folder='qa-artifacts/r73-division-word-problems';
await mkdir(folder,{recursive:true});
const fixtures=[];
for(const type of ['mixed','equal-sharing','full-groups','round-up','leftovers'])
 for(const paper of ['A4','Letter']){
  const pack=createDivisionStoryPack('division-worksheets',20261106,8,'standard',type);
  for(const output of ['questions','answers','steps']){
   const file='division-word-problems-'+type+'-'+paper.toLowerCase()+'-'+output+'.pdf';
   const bytes=await createDivisionStoryPdf(pack,output,paper);
   await writeFile(join(folder,file),bytes);
   fixtures.push({file,paper,mode:output,task:type,seed:pack.seed,
    problems:pack.problems.map(p=>({...p}))});
  }
 }
await writeFile(join(folder,'r73-pdf-manifest.json'),JSON.stringify(fixtures,null,2)+'\n');
console.log('R73 exported '+fixtures.length+' real 8-question division story PDF fixtures plus exact source rows.');
