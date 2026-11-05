/** R29 full-catalog PDF release gate.
 * All 51 live generators, maximum selectable question counts, two difficulty levels,
 * both physical page sizes, distinct practice/answer PDFs, reviewed step PDFs.
 * Files are CI-only QA artifacts, NEVER public SEO pages or user uploads.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {makeWorksheet} from '../src/lib/math.ts';
import {createWorksheetPdf} from '../src/lib/pdf.ts';
import {maxQuantityForTopic} from '../src/lib/topic-options.ts';
import {hasVerifiedSteps} from '../src/lib/capabilities.ts';
import {titleFor} from '../src/lib/site.ts';

const routes=JSON.parse(await readFile(new URL('../src/data/routes.json',import.meta.url),'utf8'))
 .filter(route=>route.type==='CONDITIONAL_TOOL'||route.type==='CONDITIONAL_HUB');
assert.equal(routes.length,51,'Route scope changed: audit all and only the 51 live generators');
const output='qa-artifacts/pdf-stress';await mkdir(output,{recursive:true});
const paperDimensions={Letter:[612,792],A4:[595.28,841.89]};
const manifest={schema:'math-works-pdf-stress/v1',layoutVersion:'2',generatorVersion:null,
 source:'R29 release audit: 51 live routes, 40 or configured maximum questions',topics:routes.length,cases:[],files:[]};
let allPages=0,allDocuments=0;
for(const [index,{slug}] of routes.entries())for(const [difficultyIndex,difficulty] of ['standard','challenge'].entries()){
 const quantity=maxQuantityForTopic(slug,{},difficulty),seed=20261105+index*977+difficultyIndex*4099;
 assert.ok(quantity>=1&&quantity<=40,`${slug} has invalid maximum quantity ${quantity}`);
 const set=makeWorksheet(slug,seed,quantity,difficulty);
 assert.equal(set.problems.length,quantity,`${slug} failed to generate maximal worksheet`);
 assert.equal(set.answerMap.length,quantity,`${slug} answer count differs`);
 assert.equal(set.layoutVersion,'2',`${slug} generated stale PDF layout contract`);
 manifest.generatorVersion??=set.generatorVersion;
 assert.equal(set.generatorVersion,manifest.generatorVersion,'Mixed generator versions in one audit');
 const unique=new Set();
 for(const [j,problem] of set.problems.entries()){
  assert.equal(problem.id,`Q${j+1}`,`${slug}: changed question sequence`);
  assert.equal(problem.expectedAnswer,set.answerMap[j].answer,`${slug}: answer mismatch at ${j+1}`);
  assert.equal(problem.id,set.answerMap[j].id,`${slug}: answer ID mismatch at ${j+1}`);
  assert.ok(problem.payload.question.trim()&&problem.expectedAnswer.trim(),`${slug}: blank problem/answer`);
  const signature=JSON.stringify([problem.payload.question,problem.diagramSpec??null]);
  assert.ok(!unique.has(signature),`${slug}: duplicate question`);unique.add(signature);
 }
 const caseKey=`${slug}-${difficulty}`;
 const qaCase={topic:slug,difficulty,seed,quantity,optionsHash:set.optionsHash,
  questions:set.problems.map(p=>({id:p.id,question:p.payload.question,answer:p.expectedAnswer,steps:p.solutionSteps,diagram:p.diagramSpec?.kind??null})),
  files:[]};
 for(const paper of ['Letter','A4'])for(const mode of ['questions','answers',...(hasVerifiedSteps(slug)?['steps']:[])]){
  const filename=`${caseKey}-${paper.toLowerCase()}-${mode}.pdf`;
  const bytes=await createWorksheetPdf(set,titleFor(slug),mode,paper);
  assert.ok(bytes.length>900,`${filename}: empty PDF`);
  const pdf=await PDFDocument.load(bytes);
  const [pw,ph]=paperDimensions[paper];
  assert.ok(pdf.getPageCount()>0&&pdf.getPageCount()<=quantity,`${filename}: implausible page count ${pdf.getPageCount()}`);
  for(const [pageIndex,page] of pdf.getPages().entries()){
   assert.ok(Math.abs(page.getWidth()-pw)<.08&&Math.abs(page.getHeight()-ph)<.08,`${filename} p${pageIndex+1}: wrong media box`);
  }
  assert.ok(pdf.getTitle()?.includes(`generator v${set.generatorVersion}`),`${filename}: missing generator identity`);
  assert.ok(pdf.getTitle()?.includes(set.optionsHash),`${filename}: missing config identity`);
  assert.ok(pdf.getTitle()?.includes('layout 2'),`${filename}: missing layout v2 identity`);
  const checksum=createHash('sha256').update(bytes).digest('hex');
  await writeFile(join(output,filename),bytes);
  const file={name:filename,topic:slug,difficulty,seed,quantity,paper,mode,pages:pdf.getPageCount(),bytes:bytes.length,sha256:checksum};
  manifest.files.push(file);qaCase.files.push(filename);allDocuments++;allPages+=pdf.getPageCount();
 }
 manifest.cases.push(qaCase);
}
assert.equal(manifest.cases.length,102);
assert.ok(allDocuments>=408,`Audit under-tested: only ${allDocuments} files`);
manifest.summary={topics:routes.length,cases:manifest.cases.length,documents:allDocuments,pages:allPages};
await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(`R29 PDF release audit: ${routes.length} topics; 102 maximal worksheet cases; ${allDocuments} real PDF documents; ${allPages} pages.`);
