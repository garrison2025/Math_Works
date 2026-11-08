/** R103 online-only Cloudflare Pages acceptance: never tests local dist. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {PDFDocument} from 'pdf-lib';

const base='https://math-works.pages.dev',sha=process.env.GITHUB_SHA;
assert.match(sha,/^[a-f0-9]{40}$/,'Expected GitHub commit SHA');
const dir='qa-artifacts/r103-live';mkdirSync(dir,{recursive:true});
const evidence={url:base,sha,checks:[],pdfs:[],errors:[]};
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const meta=(html,name)=>{
 const tag=html.match(new RegExp('<meta\\b[^>]*\\bname="'+name+'"[^>]*>','i'))?.[0]||'';
 return tag.match(/content="([^"]*)"/i)?.[1]||'';
};
const get=async(url)=>{const r=await fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});return {status:r.status,body:await r.text()};};
async function verify(){
 let actual='';
 for(let i=0;i<45;i++){
  const r=await get(base+'/?sha='+sha.slice(0,12));actual=meta(r.body,'math-works-build-sha');
  if(r.status===200&&actual===sha)break;
  await sleep(10000);
 }
 assert.equal(actual,sha,'Actual live Cloudflare deployment SHA must equal GitHub main SHA');
 evidence.checks.push('Exact production deployment SHA verified');
 const routes=JSON.parse(readFileSync(new URL('../src/data/routes.json',import.meta.url),'utf8'));
 assert.equal(routes.length,55);
 let next=0;
 await Promise.all(Array.from({length:5},async()=>{
  while(next<routes.length){
   const route=routes[next++],r=await get(base+'/'+route.slug+'/');
   assert.equal(r.status,200,'Route HTTP '+route.slug);
   assert.equal(meta(r.body,'math-works-build-sha'),sha,'Stale route '+route.slug);
   assert.equal(meta(r.body,'robots'),'noindex,nofollow','Search indexing gate '+route.slug);
   if(route.type==='HOLD')assert.ok(!/<link[^>]+rel="canonical"/i.test(r.body),'HOLD canonical '+route.slug);
  }
 }));
 evidence.checks.push('55 real HTTP 200 routes including 51 tools and 4 HOLDs; exact SHA and noindex');
 const robots=await get(base+'/robots.txt');assert.equal(robots.status,200);evidence.checks.push('robots.txt HTTP 200');
 const exe=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 assert.ok(exe,'Chrome executable not found');
 const browser=await chromium.launch({headless:true,executablePath:exe,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
  const page=await ctx.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));
  const response=await page.goto(base+'/worksheets-by-grade/',{waitUntil:'networkidle',timeout:45000});
  assert.equal(response?.status(),200);
  await page.locator('[data-wide-mode]').selectOption('grade5-full');
  assert.equal(await page.locator('[data-wide-count]').inputValue(),'40');
  assert.equal(await page.locator('[data-wide-list]>li').count(),40);
  assert.match(await page.locator('[data-wide-status]').innerText(),/26 Grade 5 CCSS/);
  assert.equal(await page.locator('.wide-diagram svg').count(),3);
  assert.equal(await page.locator('.wide-answer').count(),0);
  const first=await page.locator('[data-wide-list]>li>p:first-child').first().innerText();
  const mobile=await page.evaluate(()=>[innerWidth,document.documentElement.scrollWidth]);
  assert.ok(mobile[1]<=mobile[0]+3,'390px viewport horizontal overflow');
  await page.screenshot({path:dir+'/grade5-mobile.png',fullPage:true});
  await page.locator('[data-wide-toggle]').click();
  assert.equal(await page.locator('.wide-answer').count(),40);assert.equal(await page.locator('.wide-steps').count(),40);
  await page.locator('[data-wide-toggle]').click();assert.equal(await page.locator('.wide-answer').count(),0);
  for(const edition of ['questions','answers','steps']){
   const dlPromise=page.waitForEvent('download',{timeout:90000});
   await page.locator('[data-wide-download="'+edition+'"]').click();
   const dl=await dlPromise;
   assert.ok(dl.suggestedFilename().includes('-grade5-full-'));
   const stream=await dl.createReadStream();assert.ok(stream,'PDF stream unavailable');
   const chunks=[];for await(const chunk of stream)chunks.push(chunk);
   const bytes=Buffer.concat(chunks),pdf=await PDFDocument.load(bytes);
   assert.ok(bytes.length>5000);assert.ok(pdf.getPageCount()>=3);
   assert.ok(pdf.getTitle().includes('WM1-20261108-grade5-full-standard-40'));
   assert.ok(pdf.getTitle().includes(edition));
   evidence.pdfs.push({edition,paper:'Letter',count:40,bytes:bytes.length,pages:pdf.getPageCount()});
  }
  await page.locator('[data-wide-count]').selectOption('48');
  assert.equal(await page.locator('[data-wide-list]>li').count(),48);
  assert.equal(await page.locator('[data-wide-list]>li>p:first-child').first().innerText(),first);
  await page.locator('[data-wide-level]').selectOption('challenge');
  await page.locator('[data-wide-seed]').fill('314159');await page.locator('[data-wide-seed]').dispatchEvent('change');
  assert.equal(await page.locator('[data-wide-list]>li').count(),48);
  assert.notEqual(await page.locator('[data-wide-list]>li>p:first-child').first().innerText(),first);
  assert.notEqual(await page.locator('[data-wide-status]').getAttribute('data-error'),'true');
  await page.locator('[data-wide-paper]').selectOption('A4');
  const pending=page.waitForEvent('download',{timeout:90000});
  await page.locator('[data-wide-download="questions"]').click();
  const dl=await pending,stream=await dl.createReadStream();assert.ok(stream);
  const chunks=[];for await(const chunk of stream)chunks.push(chunk);
  const pdf=await PDFDocument.load(Buffer.concat(chunks));
  assert.ok(Math.abs(pdf.getPage(0).getWidth()-595.28)<.2);
  assert.ok(pdf.getTitle().includes('WM1-314159-grade5-full-challenge-48'));
  evidence.pdfs.push({edition:'questions',paper:'A4',count:48,pages:pdf.getPageCount()});
  await page.setViewportSize({width:1280,height:900});
  const desktop=await page.evaluate(()=>[innerWidth,document.documentElement.scrollWidth]);
  assert.ok(desktop[1]<=desktop[0]+3,'1280px viewport horizontal overflow');
  await page.screenshot({path:dir+'/grade5-desktop.png',fullPage:true});
  assert.deepEqual(evidence.errors,[],'Browser uncaught page errors');
  evidence.checks.push('Live mobile/desktop Grade 5 40/48, three Letter PDF downloads, one A4 PDF, steps, seed changes and zero browser errors');
 }finally{await browser.close();}
}
try{await verify();evidence.result='PASS';console.log('R103 LIVE SUCCESS: '+evidence.checks.join('; '));}
catch(e){evidence.result='FAIL';evidence.errors.push(String(e?.stack||e));console.error(e);process.exitCode=1;}
finally{writeFileSync(dir+'/summary.json',JSON.stringify(evidence,null,2)+'\n');}
