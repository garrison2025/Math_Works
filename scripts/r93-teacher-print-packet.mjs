/** Review packet contains real original generator problems, teacher answer keys,
 * and actual printable calibration PDFs. It cannot sign off a human or printer.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {PDFDocument} from 'pdf-lib';
import routes from '../src/data/routes.json' with {type:'json'};
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf,createPrinterCalibrationPdf,createBlankProtractorPdf} from '../src/lib/pdf.ts';
import {assertWorksheetMath} from '../src/lib/math-release-oracle.ts';
import {hasVerifiedSteps} from '../src/lib/capabilities.ts';
const out='qa-artifacts/r93-teacher-print-acceptance';
mkdirSync(out,{recursive:true});
const live=routes.filter(r=>r.type!=='HOLD'),seed=20261107;
assert.equal(live.length,51);
const rows=[];
for(const route of live){
 const sample=makeWorksheet(route.slug,seed,8,'standard');
 assertWorksheetMath(sample);
 for(const [i,prob] of sample.problems.entries()){
  rows.push({
   slug:route.slug,caseId:route.slug+'-'+String(i+1).padStart(2,'0'),seed,
   problem:prob.payload.question,expectedAnswer:prob.expectedAnswer,
   independentlyVerifiedBaseSteps:hasVerifiedSteps(route.slug),
   steps:hasVerifiedSteps(route.slug)?prob.solutionSteps.join(' | '):'Not independently certified in base v18 (export blocked)',
   teacherMath:'NOT REVIEWED',teacherClarity:'NOT REVIEWED',
   diagramLegibility:'NOT REVIEWED',curriculumFit:'NOT REVIEWED',
   reviewerName:'',reviewDate:'',notes:''
  });
 }
}
assert.equal(rows.length,408);
const columns=Object.keys(rows[0]),cell=x=>'"'+String(x??'').replaceAll('"','""').replace(/\r?\n/g,' ')+'"';
writeFileSync(join(out,'teacher-math-review-408-cases.csv'),
 [columns.join(','),...rows.map(row=>columns.map(col=>cell(row[col])).join(','))].join('\n')+'\n');
const target=[
 'printable-protractor','long-division-worksheets',
 'fractions-worksheets','area-of-trapezoids-worksheets',
 'box-plots-worksheets','scatter-plot-worksheets',
 'two-step-equations-worksheets','multiplication-worksheets',
 'coordinate-plane-worksheets','pythagorean-worksheets'
];
const packet=[];
for(const paper of ['Letter','A4']){
 for(const slug of target){
  const worksheet=makeWorksheet(slug,seed,8,'standard');
  const modes=['questions','answers'];
  if(hasVerifiedSteps(slug))modes.push('steps');
  for(const mode of modes){
   const bytes=await createWorksheetPdf(worksheet,slug,mode,paper);
   const doc=await PDFDocument.load(bytes);
   assert.ok(doc.getPageCount()>0);
   const width=paper==='Letter'?612:595.28;
   assert.ok(Math.abs(doc.getPage(0).getWidth()-width)<0.1);
   const filename=slug+'-'+mode+'-'+paper.toLowerCase()+'.pdf';
   writeFileSync(join(out,filename),bytes);
   packet.push({file:filename,topic:slug,paper,mode,pages:doc.getPageCount(),
    printed:'NOT RUN',measured:'NOT RUN'});
  }
 }
 const calibr=await createPrinterCalibrationPdf(paper);
 const name='printer-calibration-'+paper.toLowerCase()+'.pdf';
 writeFileSync(join(out,name),calibr);
 packet.push({file:name,paper,mode:'physical-scale-calibration',printed:'NOT RUN',measured:'NOT RUN'});
 const prot=await createBlankProtractorPdf(paper);
 const protractor='blank-protractor-'+paper.toLowerCase()+'.pdf';
 writeFileSync(join(out,protractor),prot);
 packet.push({file:protractor,paper,mode:'protractor-scale-check',printed:'NOT RUN',measured:'NOT RUN'});
}
const checklist=[
 '# Math Worksheet Studio — owner/teacher/physical-printer sign-off',
 '',
 'Generated: 2026-11-07 from frozen V2.0; **no human has approved these samples**.',
 'Digital generator math oracle and PDF MediaBox passed. Real print and teaching suitability NOT RUN.',
 '',
 '## Teacher examination',
 '- Open \`teacher-math-review-408-cases.csv\`: 8 seeded examples from **each of 51 working routes**.',
 '- For each sample verify the question is unambiguous, the answer is mathematically correct, diagrams agree with the written problem, and grade suitability is appropriate.',
 '- Inspect 408 rows; enter reviewer name/date, explicit PASS or FAIL in math/clarity/diagram/curriculum columns, and a defect/issue link for every FAIL.',
 '- For the 51 independently reconstructed **base** worked-step topics after R95, compare printed explanation against the actual arithmetic; other specialized PDF packs have different assertions and are not automatically equivalent to base worked-step certification.',
 '- Teacher approval requires every relevant row marked PASS, no open blocker, and a human signature. This report does **not** issue approval.',
 '',
 '## Physical printer',
 '- Print \`printer-calibration-letter.pdf\` and \`printer-calibration-a4.pdf\` using Chrome/Edge **Actual Size / 100%**; disable Fit/Shrink.',
 '- With a verified physical ruler measure the 100mm horizontal, 100mm vertical and 50mm lines and 25mm square; record all measured millimeters.',
 '- The V2.0 **protractor-specific** 50mm measurement must be within 49–51mm. Check origin, 0° to the right, 90° up, label clarity and full 180° arc; trace positions using a real protractor.',
 '- Print one student PDF and its answer PDF for each of ten sample topics on both Letter and A4; check no clipped text, 36pt margins, usable writing space, correct scale and no answer leakage.',
 '- Printer model, driver version, print dialog scale, paper brand, measured physical dimensions, date and reviewer name are all mandatory for independent sign-off.',
 '- Record differences between digital vectors and physical output as issues. **A renderer or a PDF audit cannot replace measurements**.',
 '',
 '## Release acceptance',
 '- A signed teacher checklist and real print sheets are prerequisites for formal teacher/physical-print certification.',
 '- Do not turn off \`noindex,nofollow\` or assert GSC/AdSense readiness based on this kit alone.'
].join('\n');
writeFileSync(join(out,'README-human-signoff.md'),checklist+'\n');
const checklistFields=['paper','printerModel','driverVersion','scalePercent','measured100mmHorizontal','measured100mmVertical','measured50mm','measured25mmSquare','protractor180AndLabels','printedSamplePdfsReviewed','reviewerName','reviewDate','result','defects'];
writeFileSync(join(out,'physical-printer-measurements.csv'),
 [checklistFields.join(','),...['Letter','A4'].map(x=>[x,...Array(checklistFields.length-1).fill('NOT RUN')].map(cell).join(','))].join('\n')+'\n');
writeFileSync(join(out,'manifest.json'),JSON.stringify({
 schema:'mathworks-r93-human-print-review/v1',sourceRoutes:55,builtTopics:51,
 sampleTeacherRows:408,actualPDFs:packet.length,packet,
 digitalMathOracle:'PASS',digitalPDFMediaBox:'PASS',
 teacherSignoff:'NOT RUN',physicalPrinterMeasurements:'NOT RUN',
 purchasedDomain:false,publicIndexAuthorization:false
},null,2)+'\n');
console.log('R93 acceptance packet created: 408 teacher cases, '+packet.length+' sampled printable PDFs; teacher and physical print NOT RUN');
