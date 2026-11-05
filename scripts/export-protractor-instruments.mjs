/** R31: release-only real, unscaled physical protractor PDF fixtures.
 * These are NOT worksheets and are never added to the public Astro bundle. */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createBlankProtractorPdf} from '../src/lib/pdf.ts';
const output='qa-artifacts/protractor-instruments';
await mkdir(output,{recursive:true});
const records=[];
for(const [paper,expectedSize] of [['Letter',[612,792]],['A4',[595.28,841.89]]]){
 const bytes=await createBlankProtractorPdf(paper);
 const name=`blank-protractor-${paper.toLowerCase()}.pdf`;
 await writeFile(join(output,name),bytes);
 records.push({name,paper,pageSizePt:expectedSize,bytes:bytes.length,
  sha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile(join(output,'manifest.json'),JSON.stringify({
 schema:'math-works-physical-protractor/v1',
 source:'R31 independently audited actual-size blank protractor PDFs',
 radiusMm:72,calibrationMm:50,printInstruction:'Actual size / 100%; physically measure the bar',
 files:records
},null,2));
console.log('Saved exactly two R31 physical protractor PDF fixtures (Letter/A4)');
