/** R64 print evidence files for the dedicated 12x12 multiplication chart. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createMultiplicationGridPdf,multiplicationGridValue} from '../src/lib/multiplication-grid.ts';
const out='qa-artifacts/r64-multiplication-grid';
await mkdir(out,{recursive:true});
const exports=[];
for(const paper of ['Letter','A4'])for(const mode of ['blank','key']){
 const filename='multiplication-chart-1-12-'+paper.toLowerCase()+'-'+mode+'.pdf';
 const pdf=await createMultiplicationGridPdf(paper,mode);
 await writeFile(join(out,filename),pdf);
 exports.push({filename,paper,mode,bytes:pdf.byteLength});
}
const sourceAnswerGrid=Array.from({length:12},(_,r)=>
 Array.from({length:12},(_,c)=>multiplicationGridValue(r+1,c+1)));
await writeFile(join(out,'expected-144-products.json'),
 JSON.stringify({grid:sourceAnswerGrid,expectedCells:169,expectedQuestionBlanks:144,
  expectedAnswerNumbers:144,papers:['Letter','A4'],modes:['blank','key'],
  note:'Independent auditor must inspect actual PDF text and vector cells, not trust this manifest alone.'},null,2)+'\n');
await writeFile(join(out,'generated-files.json'),JSON.stringify(exports,null,2)+'\n');
console.log('R64 exported four original vector 1–12 chart PDFs: A4/Letter student blank and full teacher key');
