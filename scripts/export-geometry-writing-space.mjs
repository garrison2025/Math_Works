/** R61 fixed-seed print evidence for calculation worklines vs diagram controls.
 * PDFs are produced by the exact browser exporter, not a synthetic drawing.
 * A4/Letter and default/extra/answer variants expose potential orphan pages.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';

const cases=[
 ['area-worksheets','rectangle',1],
 ['area-of-triangles-worksheets','triangle',2],
 ['area-of-parallelograms-worksheets','parallelogram',2],
 ['area-of-trapezoids-worksheets','trapezoid',2],
 ['volume-of-rectangular-prisms-worksheets','prism',2],
 ['surface-area-worksheets','prism',2],
 ['pythagorean-worksheets','right-triangle',2],
 ['triangle-angle-sum-worksheets','triangle-angles',1],
 ['complementary-supplementary-angles-worksheets','angle',1],
 ['vertical-angles-worksheets','intersecting-lines',1],
 // Controls must NOT inherit calculation rules by mistake.
 ['scatter-plot-worksheets','scatter',0],
 ['box-plots-worksheets','box-practice',0],
 ['long-division-worksheets','long-division',0],
 ['printable-protractor','protractor',0],
 ['angle-worksheets','angle',0]
];
const out='qa-artifacts/r61-geometry-writing-space';
await mkdir(out,{recursive:true});
const manifest={schema:'mathworks-r61-geometry-room/v1',documents:[],
  sources:'real browser PDF generator; 8 questions per document',
  teacherApproval:'NOT REVIEWED',physicalPrint:'NOT MEASURED'};
for(const [i,[topic,kind,baseLines]] of cases.entries()){
 const seed=20261106+i*117;
 const sheet=makeWorksheet(topic,seed,8,'standard');
 if(!sheet.problems.every(p=>p.diagramSpec?.kind===kind))throw Error('R61 fixture wrong diagram for '+topic);
 for(const paper of ['A4','Letter'])
  for(const [mode,room] of [['questions','standard'],['questions','extra'],['answers','extra']]){
   const filename=topic+'-'+paper.toLowerCase()+'-'+mode+'-'+room+'.pdf';
   const bytes=await createWorksheetPdf(sheet,topic,mode,paper,room);
   const pdf=await PDFDocument.load(bytes);
   await writeFile(join(out,filename),bytes);
   manifest.documents.push({file:filename,topic,kind,baseLines,mode,room,paper,seed,
     questionIds:sheet.problems.map(p=>p.id),pages:pdf.getPageCount()});
  }
}
if(manifest.documents.length!==90)throw Error('Expected 90 controlled real PDF fixtures');
await writeFile(join(out,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('R61 exported 90 true-vector student/extra/teacher A4/Letter calculation and control PDFs');
