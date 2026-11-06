/** R60: 40-question teacher key and student layout side-by-side PDF fixtures.
 * The exact problems are taken from the real generator and exported with the
 * same browser-facing PDF routine. No newly indexable pages are created.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';

const out='qa-artifacts/r60-teacher-key';
await mkdir(out,{recursive:true});
const textTopics=[
 'two-step-equations-worksheets','fractions-worksheets',
 'scientific-notation-worksheets','functions-worksheets',
 'mean-median-mode-range-worksheets','percentages-worksheets',
 'addition-worksheets','integer-operations-worksheets'
];
const diagramTopics=['box-plots-worksheets','scatter-plot-worksheets','long-division-worksheets'];
const manifest={
 schema:'mathworks-r60-teacher-key/v1',source:'exact browser PDF renderer, no print calibration claim',
 documents:[],testScope:'both physical page sizes and maximum 40-question answer keys',
 teacherApproval:'NOT REVIEWED',printer100Percent:'NOT MEASURED'
};
for(const [index,topic] of [...textTopics,...diagramTopics].entries()){
 const withDiagram=index>=textTopics.length,qty=withDiagram?8:40;
 const seed=20261106+index*227;
 const sheet=makeWorksheet(topic,seed,qty,'standard');
 if(sheet.problems.some(p=>Boolean(p.diagramSpec))!==withDiagram)
  throw new Error('R60 cannot classify PDF layout from topic: '+topic);
 const ids=sheet.problems.map(p=>p.id);
 const answers=sheet.problems.map(p=>p.expectedAnswer);
 for(const paper of ['A4','Letter']){
  for(const mode of withDiagram?['answers']:['questions','answers']){
   const filename=topic+'-'+paper.toLowerCase()+'-'+mode+'.pdf';
   const bytes=await createWorksheetPdf(sheet,topic,mode,paper);
   const doc=await PDFDocument.load(bytes);
   await writeFile(join(out,filename),bytes);
   manifest.documents.push({file:filename,topic,qty,seed,paper,mode,withDiagram,
    pages:doc.getPageCount(),ids,answers});
  }
 }
}
if(manifest.documents.length!==38)throw new Error('R60: expected 32 no-diagram and 6 diagram reference PDFs');
await writeFile(join(out,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('R60 exported 38 A4/Letter teacher, student and full-width chart PDF samples');
