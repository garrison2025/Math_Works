/** R91 cross-browser invariant: Chrome and Firefox generate identical
 * rendered question strings and independent answer strings for EVERY built
 * V2.0 generator. Uses the exact same Astro build artifact between jobs.
 * This is not a claim that browser-native PDF byte streams are identical,
 * nor does it replace teacher/physical print or independent math oracles.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createReadStream,existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {join,resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,firefox} from 'playwright-core';
import routes from '../src/data/routes.json' with {type:'json'};
import {topicOptionsFor} from '../src/lib/topic-options.ts';

const mode=process.argv[2];
if(!['chromium','firefox'].includes(mode))
 throw Error('Usage: node --experimental-strip-types scripts/qa-r91-browser-parity.mjs chromium|firefox');
const dist=resolve('dist');
assert.ok(existsSync(join(dist,'index.html')),'Offline built Astro site required');
const out=resolve('qa-artifacts/r91-browser-parity');
mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript',
 '.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png',
 '.json':'application/json','.txt':'text/plain'};
const server=createServer((req,res)=>{
 try{
  const path=new URL(req.url??'/', 'http://localhost').pathname;
  let file=resolve(dist,'.'+decodeURIComponent(path));
  if(file!==dist&&!file.startsWith(dist+sep)){res.writeHead(403);res.end();return}
  if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');
  if(!existsSync(file)||!statSync(file).isFile()){
   res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');return;
  }
  res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream',
   'Cache-Control':'no-store'});
  createReadStream(file).pipe(res);
 }catch(error){res.writeHead(400);res.end(String(error))}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const nonHold=routes.filter(r=>r.type!=='HOLD');
assert.equal(nonHold.length,51);
assert.equal(routes.filter(r=>r.type==='HOLD').length,4);
const scenarios=[];
for(const topic of nonHold){
 scenarios.push({slug:topic.slug,variant:'default',seed:20261104,option:null});
 const special=topicOptionsFor(topic.slug).find(def=>
  def.choices.some(choice=>choice.value!==def.defaultValue));
 const different=special?.choices.find(c=>c.value!==special.defaultValue);
 scenarios.push({slug:topic.slug,variant:'other-seed-and-option',seed:20261105,
  option:special&&different?{key:special.key,value:different.value}:null});
}
assert.equal(scenarios.length,102);
const browserType=mode==='chromium'?chromium:firefox;
const executable=mode==='chromium'?
 [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable',
  '/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean).find(existsSync):undefined;
let browser,context;
const snapshots=[];
const errors=[];
try{
 browser=await browserType.launch(mode==='chromium'?
  {headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']}:
  {headless:true});
 context=await browser.newContext({viewport:{width:1280,height:860}});
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 page.setDefaultTimeout(16000);
 for(const scenario of scenarios){
  const params=new URLSearchParams({gv:'18',seed:String(scenario.seed),difficulty:'standard',
   quantity:'8',paper:'Letter'});
  if(scenario.option)params.set('opt_'+scenario.option.key,scenario.option.value);
  const url=base+'/'+scenario.slug+'/?'+params.toString();
  const response=await page.goto(url,{waitUntil:'networkidle',timeout:30000});
  assert.equal(response?.status(),200,scenario.slug+' build route missing');
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),
   'noindex,nofollow','R91 must not change indexing on preview');
  assert.equal(await page.locator('[data-workspace]').getAttribute('data-topic'),scenario.slug);
  assert.equal(await page.locator('[data-field="seed"]').inputValue(),String(scenario.seed));
  if(scenario.option)
   assert.equal(await page.locator('[data-option="'+scenario.option.key+'"]').inputValue(),
    scenario.option.value,'URL failed to restore different option for '+scenario.slug);
  const questions=await page.locator('.problem .q').allTextContents();
  assert.ok(questions.length>=4&&questions.length<=40,
   'Generator produced abnormal question count '+scenario.slug+' '+questions.length);
  await page.locator('[data-mode="answers"]').click();
  const answerRows=await page.locator('.problem .answer-text').allTextContents();
  assert.equal(answerRows.length,questions.length,
   'Generator answer count mismatch '+scenario.slug);
  const canonical=text=>text.normalize('NFKC').replace(/\s+/g,' ').trim();
  const questionsNorm=questions.map(canonical),answersNorm=answerRows.map(canonical);
  assert.ok(questionsNorm.every(Boolean)&&answersNorm.every(Boolean),
   'Blank generated question or answer in '+scenario.slug);
  snapshots.push({slug:scenario.slug,variant:scenario.variant,seed:scenario.seed,
   option:scenario.option,questions:questionsNorm,answers:answersNorm});
 }
 assert.deepEqual(errors,[],'Uncaught '+mode+' browser errors');
 const fingerprint=createHash('sha256').update(JSON.stringify(snapshots)).digest('hex');
 const manifest={schema:'mathworks-r91-rendered-math-parity/v1',browser:mode,
  generatorVersion:'v18',topics:51,scenarios:102,questions:snapshots.reduce((n,s)=>n+s.questions.length,0),
  sha256:fingerprint,snapshots};
 writeFileSync(join(out,mode+'.json'),JSON.stringify(manifest,null,2)+'\n');
 let result={status:'PASS',mode,topics:51,scenarios:102,questionAnswerPairs:manifest.questions,
  checksum:manifest.sha256,reference:'same 51-route and 102-scenario exact build'};
 if(mode==='firefox'){
  const ref=join(process.cwd(),'qa-artifacts','r91-chromium-reference','chromium.json');
  assert.ok(existsSync(ref),'No Chromium reference artifact; cross-browser check cannot pass');
  const before=JSON.parse(readFileSync(ref,'utf8'));
  assert.equal(before.schema,manifest.schema);
  assert.equal(before.browser,'chromium');
  assert.equal(before.topics,51);assert.equal(before.scenarios,102);
  const discrepancies=[];
  for(let i=0;i<snapshots.length;i++){
   const a=before.snapshots[i],b=snapshots[i];
   if(JSON.stringify(a)!==JSON.stringify(b)){
    const questionIndex=b.questions.findIndex((v,n)=>v!==a?.questions?.[n]);
    const answerIndex=b.answers.findIndex((v,n)=>v!==a?.answers?.[n]);
    discrepancies.push({slug:b.slug,variant:b.variant,questionIndex,answerIndex,
     chromeQuestion:questionIndex>=0?a?.questions?.[questionIndex]:undefined,
     firefoxQuestion:questionIndex>=0?b.questions[questionIndex]:undefined,
     chromeAnswer:answerIndex>=0?a?.answers?.[answerIndex]:undefined,
     firefoxAnswer:answerIndex>=0?b.answers[answerIndex]:undefined});
   }
  }
  result={...result,referenceChecksum:before.sha256,
   actualChecksum:manifest.sha256,discrepancies:discrepancies.length,
   status:discrepancies.length?'FAIL':'PASS'};
  writeFileSync(join(out,'comparison.json'),JSON.stringify({...result,
   differences:discrepancies.slice(0,20)},null,2)+'\n');
  assert.equal(discrepancies.length,0,
   'Chromium vs Firefox differ on '+discrepancies.length+
   ' deterministic worksheet scenarios: '+JSON.stringify(discrepancies.slice(0,2)));
  assert.equal(manifest.sha256,before.sha256,'Exact math snapshot checksum must match');
 }
 writeFileSync(join(out,'summary-'+mode+'.json'),JSON.stringify(result,null,2)+'\n');
 console.log('R91 '+mode+' cross-browser math manifest '+result.status+
  ': 51 topics, 102 scenarios, '+manifest.questions+' question/answer pairs; SHA256 '+fingerprint);
}catch(error){
 writeFileSync(join(out,'failure-'+mode+'.json'),JSON.stringify({
  result:'FAIL',mode,completedScenarios:snapshots.length,error:String(error?.stack??error),
  browserErrors:errors},null,2));
 throw error;
}finally{
 if(context)await context.close();
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
