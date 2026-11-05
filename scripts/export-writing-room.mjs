/** R54 digital-only printer writing-room evidence.
 * Outputs paired real PDFs; vector test verifies line counts per page.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
const output='qa-artifacts/r54-writing-room';
await mkdir(output,{recursive:true});
const topics=[
 'addition-worksheets',
 'two-step-equations-worksheets',
 'area-of-triangles-worksheets',
 'long-division-worksheets',
 'printable-protractor'
];
const files=[];
for(const slug of topics)for(const paper of ['A4','Letter']){
 const sheet=makeWorksheet(slug,20261106,8,'standard');
 for(const room of ['standard','extra']){
  const name=`${slug}-${paper.toLowerCase()}-${room}-questions.pdf`;
  const content=await createWorksheetPdf(sheet,slug,'questions',paper,room);
  await writeFile(join(output,name),content);
  files.push({slug,paper,room,mode:'questions',name,bytes:content.length,questions:sheet.problems.length});
 }
 if(['addition-worksheets','two-step-equations-worksheets'].includes(slug)){
  const name=`${slug}-${paper.toLowerCase()}-extra-answers.pdf`;
  const content=await createWorksheetPdf(sheet,slug,'answers',paper,'extra');
  await writeFile(join(output,name),content);
  files.push({slug,paper,room:'extra',mode:'answers',name,bytes:content.length,questions:8});
 }
}
await writeFile(join(output,'manifest.json'),JSON.stringify({
 schema:'mathworks-r54-print-room/v1',
 source:'PDF images and vectors to be checked independently; no physical printer used',
 files
},null,2));
console.log('R54 exported '+files.length+' paired true-PDF writing-room fixtures');
