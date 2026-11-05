/** R56 paper evidence for four prism teaching modes on both paper formats. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
import {prismDimensions} from '../src/lib/prism-dimensions.ts';

const folder='qa-artifacts/prism-dimensions';
await mkdir(folder,{recursive:true});
const cases=[
 ['volume-of-rectangular-prisms-worksheets',{task:'volume'},'volume-known'],
 ['volume-of-rectangular-prisms-worksheets',{task:'missing-height'},'volume-missing-height'],
 ['surface-area-worksheets',{solid:'rectangular-prism'},'surface-prism'],
 ['surface-area-worksheets',{solid:'cube'},'surface-cube']
];
const manifest={schema:'mathworks-r56-prism-v1',files:[],
 caveat:'True PDF geometry and label text; physical printer and teacher approval not tested'};
let number=0;
for(const [topic,options,variant] of cases){
 const sheet=makeWorksheet(topic,20261106+number++,8,'standard',options);
 const expected=sheet.problems.map(p=>prismDimensions(p.diagramSpec));
 for(const paper of ['A4','Letter']){
  const name=variant+'-'+paper.toLowerCase()+'.pdf';
  const bytes=await createWorksheetPdf(sheet,topic,'questions',paper);
  await writeFile(join(folder,name),bytes);
  manifest.files.push({name,topic,variant,paper,questionCount:8,
   expected:expected.map(v=>({kind:v.kind,length:v.lengthLabel,
    width:v.widthLabel,height:v.heightLabel}))});
 }
}
await writeFile(join(folder,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('R56 eight A4/Letter real prism/cube practice PDF fixtures generated');
