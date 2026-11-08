import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {spawnSync} from 'node:child_process';
import {makeStorySet,verifyStorySet,expectedStoryAnswer,STORY_CHOICES,STORY_LEVELS} from '../src/lib/word-problems.ts';
import {createStoryPdf} from '../src/lib/word-problems-pdf.ts';
import {R98_PREVIEW_ONLY_HOLD_PAGES} from '../src/lib/preview-pages.ts';
import routes from '../src/data/routes.json' with {type:'json'};
const originalModes=['proportions','area','multiplication','division','one-step','decimals'];
const numeric=token=>Number(token);
function independentAnswer(p){
 const q=p.question;
 if(p.mode==='proportions'){
  const x=q.match(/uses (\d+) cups of rice for (\d+) identical meal batches.*needed for (\d+) batches/);
  assert.ok(x,q);
  assert.equal(numeric(x[1])%numeric(x[2]),0,'Unit rate must be whole and exact');
  return (numeric(x[1])/numeric(x[2])*numeric(x[3]))+' cups';
 }
 if(p.mode==='area'){
  const x=q.match(/is (\d+) feet long and (\d+) feet wide/);assert.ok(x,q);
  return numeric(x[1])*numeric(x[2])+' square feet';
 }
 if(p.mode==='multiplication'){
  const x=q.match(/puts (\d+) markers in each box.*there are (\d+) boxes/);assert.ok(x,q);
  return numeric(x[1])*numeric(x[2])+' markers';
 }
 if(p.mode==='division'){
  const x=q.match(/shares (\d+) pencils equally among (\d+) students/);assert.ok(x,q);
  assert.equal(numeric(x[1])%numeric(x[2]),0);
  return numeric(x[1])/numeric(x[2])+' pencils';
 }
 if(p.mode==='one-step'){
  const x=q.match(/After (\d+) more books are added, it holds (\d+) books/);assert.ok(x,q);
  return numeric(x[2])-numeric(x[1])+' books';
 }
 if(p.mode==='decimals'){
  const x=q.match(/has (\d+\.\d{2}) liters of paint and adds (\d+\.\d{2}) more liters/);assert.ok(x,q);
  const cents=s=>{const [a,b]=s.split('.');return BigInt(a)*100n+BigInt(b)};
  const sum=cents(x[1])+cents(x[2]);
  return sum/100n+'.'+(sum%100n).toString().padStart(2,'0')+' liters';
 }
 throw Error('Unexpected mode '+p.mode);
}
test('R98: six original story skills use true numeric questions and match independently parsed answers across 6,720 problems',()=>{
 let problems=0,sets=0;
 for(const mode of STORY_CHOICES){
  for(const level of STORY_LEVELS){
   for(const seed of [0,1,20261104,20261108,20261109,4294967295,987654321,314159]){
    const a=makeStorySet(seed,40,mode,level),b=makeStorySet(seed,40,mode,level);
    assert.deepEqual(a,b,'Same seed and options must be reproducible');
    verifyStorySet(a);sets++;
    assert.equal(a.questions.length,40);
    assert.equal(new Set(a.questions.map(p=>p.question)).size,40);
    for(const p of a.questions){
     assert.equal(p.answer,independentAnswer(p),'Math error in rendered story '+p.id);
     assert.equal(p.answer,expectedStoryAnswer(p));
     assert.equal(p.steps.length,2);problems++;
    }
   }
  }
 }
 assert.equal(sets,STORY_CHOICES.length*STORY_LEVELS.length*8);
 assert.equal(problems,STORY_CHOICES.length*STORY_LEVELS.length*8*40);
 assert.equal(originalModes.length,6);
});
test('R98: illegal formats, nonsensical seeds, leaked or mutated answers cannot be printed',()=>{
 for(const [seed,count,mode,level] of [[-1,8,'mixed','standard'],[4294967296,8,'mixed','standard'],[1,0,'mixed','standard'],[1,5,'mixed','standard'],[1,8,'circles','standard'],[1,8,'mixed','not-a-level'],[1.2,8,'mixed','standard']])
  assert.throws(()=>makeStorySet(seed,count,mode,level));
 const set=makeStorySet(20261104,8);
 const tamper=[
  s=>{s.questions[0].answer='999 cups';},
  s=>{s.questions[0].units='meters';},
  s=>{s.questions[1].id='Q99';},
  s=>{s.questions[2].question=s.questions[0].question;},
  s=>{s.questions[3].steps[1]='No reasoning';},
  s=>{s.questions[0].values.a=0;},
  s=>{s.questions[0].mode='geometry';}
 ];
 for(const edit of tamper){const copy=structuredClone(set);edit(copy);assert.throws(()=>verifyStorySet(copy));}
});
test('R98: six actual A4/Letter PDF editions match paper dimensions and worksheet ID',async()=>{
 for(const paper of ['A4','Letter']){
  for(const edition of ['questions','answers','steps']){
   const set=makeStorySet(314159,40,'mixed','challenge');
   const bytes=await createStoryPdf(set,edition,paper);
   const doc=await PDFDocument.load(bytes);
   assert.ok(bytes.length>5000,'PDF surprisingly small');
   assert.ok(doc.getPageCount()>=4,'40 practice stories must be paginated');
   for(const page of doc.getPages()){
    assert.ok(Math.abs(page.getWidth()-(paper==='A4'?595.28:612))<.1);
    assert.ok(Math.abs(page.getHeight()-(paper==='A4'?841.89:792))<.1);
   }
   assert.match(doc.getTitle(),/WP1-314159-mixed-challenge-40/);
   assert.match(doc.getTitle(),new RegExp(edition));
  }
 }
 await assert.rejects(createStoryPdf(makeStorySet(1,8),'book','A4'));
 await assert.rejects(createStoryPdf(makeStorySet(1,8),'questions','LetterFake'));
});
test('R98: four historically held routes now have useful standalone previews but never bypass indexation approval',()=>{
 assert.equal(R98_PREVIEW_ONLY_HOLD_PAGES.length,4);
 for(const slug of R98_PREVIEW_ONLY_HOLD_PAGES){
  const route=routes.find(r=>r.slug===slug);
  assert.equal(route?.type,'HOLD','No accidental SEO index release for '+slug);
  const path=new URL('../src/pages/'+slug+'/index.astro',import.meta.url);
  assert.ok(existsSync(path),'Missing standalone page '+slug);
  const content=readFileSync(path,'utf8');
  assert.match(content,/<h1>/);
  assert.match(content,/canonicalPath=/);
 }
 const story=readFileSync(new URL('../src/components/WordProblems.astro',import.meta.url),'utf8');
 assert.match(story,/data-story-download="questions"/);
 assert.match(story,/data-story-download="answers"/);
 assert.match(story,/data-story-download="steps"/);
 const grade=readFileSync(new URL('../src/pages/worksheets-by-grade/index.astro',import.meta.url),'utf8');
 assert.match(grade,/Grade 8/);
 assert.match(grade,/systems-equations-worksheets/);
 assert.match(grade,/linear-equations-worksheets/);
 const algebra=readFileSync(new URL('../src/pages/algebra-general-worksheets/index.astro',import.meta.url),'utf8');
 assert.match(algebra,/literal-equation/);
 const geometry=readFileSync(new URL('../src/pages/geometry-general-worksheets/index.astro',import.meta.url),'utf8');
 assert.match(geometry,/surface-area-worksheets/);
});


test('R98: all 51 original HOLD-source phrases receive exactly one evidence-based scope classification',()=>{
 const matrix=readFileSync(new URL('../R98-KEYWORD-TRUTH-MATRIX.md',import.meta.url),'utf8');
 const csv=readFileSync(new URL('../src/data/keyword-evidence.csv',import.meta.url),'utf8').trimEnd().split(/\r?\n/).slice(1);
 const held=new Set(R98_PREVIEW_ONLY_HOLD_PAGES),tick=String.fromCharCode(96);
 const expected=csv.map(line=>{
  const keyword=line.startsWith(tick)?line.slice(1,line.indexOf(tick,1)):undefined;
  const last=line.slice(line.lastIndexOf(',')+1).replaceAll(tick,'');
  const slug=last.split('/')[1];
  return {keyword,slug};
 }).filter(entry=>held.has(entry.slug));
 const actual=matrix.split('\n').filter(line=>line.startsWith('| ')&&!line.includes('Exact source phrase'))
  .map(line=>line.split('|')[1]?.trim()).filter(Boolean);
 assert.equal(expected.length,51);
 assert.equal(actual.length,51);
 assert.equal(new Set(actual).size,51,'Duplicate historic keyword audit row');
 assert.deepEqual(new Set(actual),new Set(expected.map(entry=>entry.keyword)),
  'Exactly the original 51 held source phrases must be accounted for');
 for(const claim of ['SUPPORTED','DIRECTORY','PARTIAL','UNSUPPORTED','noindex,nofollow','not a Google indexing authorization']){
  assert.ok(matrix.toLowerCase().includes(claim.toLowerCase()),'Missing transparent scope label: '+claim);
 }
});

test('R98: Chromium and Firefox full browser QA scripts have valid JavaScript syntax before expensive jobs',()=>{
 for(const file of ['scripts/browser-smoke.mjs','scripts/firefox-smoke.mjs']){
  const script=new URL('../'+file,import.meta.url).pathname;
  const check=spawnSync(process.execPath,['--check',script],{encoding:'utf8'});
  assert.equal(check.status,0,file+' fails node --check: '+check.stderr);
 }
});
