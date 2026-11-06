/** R57: Cartesian axes acceptance samples, actual A4 and US Letter PDFs. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
const output='qa-artifacts/cartesian-ticks';
await mkdir(output,{recursive:true});
const cases=[
 ['coordinate-plane-worksheets',{quadrant:'IV'},'quadrants'],
 ['slope-worksheets',{line:'vertical'},'vertical-slope'],
 ['linear-equations-worksheets',{task:'evaluate',slope:'negative'},'evaluate-line'],
 ['linear-equations-worksheets',{task:'graph',slope:'positive'},'blank-line']
];
const manifest={schema:'mathworks-r57-zero-axes/v1',documents:[],physicalPaper:'NOT MEASURED'};
for(const [index,[topic,options,name]] of cases.entries()){
 const set=makeWorksheet(topic,20261106+index,8,'standard',options);
 for(const paper of ['A4','Letter']){
  const filename=name+'-'+paper.toLowerCase()+'.pdf';
  await writeFile(join(output,filename),await createWorksheetPdf(set,topic,'questions',paper));
  manifest.documents.push({file:filename,topic,paper,graphs:set.problems.length});
 }
}
await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('R57 exported 8 A4/Letter Cartesian geometry PDFs, 64 student graphs');
