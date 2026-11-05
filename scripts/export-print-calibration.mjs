/** R52 2-page-size printer scale QA; only actual PDF vectors count. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createPrinterCalibrationPdf} from '../src/lib/pdf.ts';
const out='qa-artifacts/print-calibration';
await mkdir(out,{recursive:true});
const list=[];
for(const paper of ['Letter','A4']){
 const bytes=await createPrinterCalibrationPdf(paper);
 const name='printer-calibration-'+paper.toLowerCase()+'.pdf';
 await writeFile(join(out,name),bytes);
 list.push({paper,name,bytes:bytes.length});
}
await writeFile(join(out,'manifest.json'),JSON.stringify({
 schema:'math-works-r52-print-calibration/v1',files:list,
 vectors:'100 mm horizontal, 100 mm vertical, 50 mm horizontal, 25 mm square',
 physicalValidation:'NOT RUN - user must print at actual size and measure with ruler'
},null,2));
console.log('R52 exported two PDF paper-size calibration sheets (unprinted).');
