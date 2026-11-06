import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {makeFractionStrips} from '../src/lib/fraction-strips.ts';
import {createFractionStripsPdf} from '../src/lib/fraction-strips-pdf.ts';
const folder='qa-artifacts/r72-fraction-strips';
await mkdir(folder,{recursive:true});
const manifest=[];
for(const set of ['basic','extended'])
 for(const mode of ['blank','labeled'])
  for(const paper of ['A4','Letter']){
   const pack=makeFractionStrips(set,mode);
   const filename='fraction-strips-'+set+'-'+mode+'-'+paper.toLowerCase()+'.pdf';
   await writeFile(join(folder,filename),await createFractionStripsPdf(pack,paper));
   manifest.push({filename,set,mode,paper,denominators:pack.denominators,
    expectedCellLabels:pack.cells.map(x=>x.labels),
    expectedWholeWidthPt:420,expectedRowHeightPt:32});
  }
await writeFile(join(folder,'r72-fraction-strips-fixtures.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('R72 exported 8 actual single-page blank/labelled A4/Letter vector fraction strip charts.');
