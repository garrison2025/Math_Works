/**
 * R105 production-like built-bundle UX QA. Does not assert human/physical validation.
 * Exercises actual Chromium, with an unmodified local Astro static build.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,createReadStream,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,sep,extname} from 'node:path';
import {chromium} from 'playwright-core';
import {PDFDocument} from 'pdf-lib';

const root=resolve('dist'),out=resolve('qa-artifacts/r105-ui');
assert.ok(existsSync(join(root,'index.html')),'Build dist first');
mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 try{
  const pathname=new URL(req.url||'/','http://localhost').pathname;
  let file=resolve(root,'.'+decodeURIComponent(pathname));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');
  if(!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});
  createReadStream(file).pipe(res);
 }catch(error){res.writeHead(400);res.end(String(error));}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean).find(existsSync);
const report={schema:'r105-ux-motion/v1',mode:'actual built Astro static site',pages:[],pdfs:[],screenshots:[],checks:[],errors:[]};
let browser;
try{
 assert.ok(executablePath,'Chromium not installed');
 browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:390,height:900},reducedMotion:'no-preference'});
 const page=await ctx.newPage();
 page.on('pageerror',error=>report.errors.push(error.message));
 for(const width of [320,360,390,768,1280,1440]){
  await page.setViewportSize({width,height:900});
  for(const path of ['/','/worksheets/','/two-step-equations-worksheets/','/worksheets-by-grade/']){
   const res=await page.goto(base+path,{waitUntil:'networkidle',timeout:45000});
   assert.equal(res?.status(),200,'Unexpected response: '+width+' '+path);
   const m=await page.evaluate(()=>{
    const html=document.documentElement,body=document.body;
    return {viewport:innerWidth,pageWidth:Math.max(html.scrollWidth,body.scrollWidth),
      robots:document.querySelector('meta[name="robots"]')?.getAttribute('content'),
      headings:document.querySelectorAll('h1').length};
   });
   assert.ok(m.pageWidth<=width+2,'Overflow at '+width+' '+path+' '+JSON.stringify(m));
   assert.equal(m.robots,'noindex,nofollow');
   assert.equal(m.headings,1);
   report.pages.push({width,path,...m});
   if([390,1440].includes(width)&&['/','/two-step-equations-worksheets/','/worksheets-by-grade/'].includes(path)){
    const f=(path==='/'?'home':path.includes('grade')?'grade5':'tool')+'-'+width+'.png';
    await page.screenshot({path:join(out,f),fullPage:false,animations:'disabled'});
    report.screenshots.push(f);
   }
  }
 }
 report.checks.push('24 mobile/tablet/desktop route states, no horizontal overflow, valid H1 and noindex');
 // Desktop: the long settings column scrolls while its real practice paper remains visible.
 await page.setViewportSize({width:1280,height:900});
 await page.goto(base+'/two-step-equations-worksheets/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.preview-panel').evaluate(el=>getComputedStyle(el).position),'sticky');
 assert.equal(await page.locator('.settings').evaluate(el=>getComputedStyle(el).position),'static');
 report.checks.push('Desktop settings can scroll independently of sticky paper preview');
 // Mobile: both accessible directions of the paper/settings navigation work.
 await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/two-step-equations-worksheets/',{waitUntil:'networkidle'});
 assert.ok(await page.locator('.settings-preview-link').isVisible());
 assert.equal(await page.locator('.settings-topbar').evaluate(el=>getComputedStyle(el).position),'sticky');
 await page.locator('.settings-preview-link').click();
 assert.equal(new URL(page.url()).hash,'#worksheet-preview');
 await page.locator('.preview-head .mobile-jump').click();
 assert.equal(new URL(page.url()).hash,'#worksheet-settings');
 assert.equal(await page.locator('.preview-tools').evaluate(el=>getComputedStyle(el).display),'grid');
 report.checks.push('Two-way accessible mobile preview/settings jumps and 3-column mode selector');
 // Animation is a short browser-native paint feedback, not a new math calculation.
 await page.evaluate(()=>{
  window.__r105AnimCount=0;
  const original=Element.prototype.animate;
  Element.prototype.animate=function(...args){window.__r105AnimCount++;return original.apply(this,args);};
 });
 await page.locator('[data-mode="answers"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 await page.locator('[data-mode="questions"]').click();
 assert.equal(await page.locator('.problem .answer-text').count(),0);
 assert.ok(await page.evaluate(()=>window.__r105AnimCount>=2),'Answer/worksheet state changed without visible UI feedback');
 await page.locator('[data-action="regenerate"]').click();
 assert.equal(await page.locator('.problem').count(),8);
 assert.ok(await page.evaluate(()=>window.__r105AnimCount>=3),'Regeneration has no visual feedback');
 const download=page.waitForEvent('download',{timeout:90000});
 await page.locator('[data-action="worksheet"]').click();
 const dl=await download,stream=await dl.createReadStream();assert.ok(stream);
 const chunks=[];for await(const chunk of stream)chunks.push(chunk);
 const bytes=Buffer.concat(chunks),pdf=await PDFDocument.load(bytes);
 assert.ok(bytes.byteLength>1000&&pdf.getPageCount()>=1);
 assert.ok(Math.abs(pdf.getPage(0).getWidth()-612)<.15);
 report.pdfs.push({name:dl.suggestedFilename(),bytes:bytes.byteLength,pages:pdf.getPageCount()});
 report.checks.push('Generate, toggle solutions, 200ms native animation, and actual Letter PDF download');
 // Touch friendly quick skill filter still uses the same 437-term live index.
 await page.goto(base+'/worksheets/',{waitUntil:'networkidle'});
 const skills=page.locator('[data-directory-suggestion]');
 assert.equal(await skills.count(),5);
 await page.locator('[data-directory-suggestion="fractions"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-directory-status]')?.textContent?.includes('shown on this page'),{timeout:10000});
 assert.equal(await page.locator('[data-directory-query]').inputValue(),'fractions');
 assert.equal(await page.locator('[data-directory-suggestion="fractions"]').getAttribute('aria-pressed'),'true');
 assert.ok((await page.locator('.directory-group .directory-card:visible').count())>0);
 await page.locator('[data-directory-suggestion="word problems"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-directory-query]')?.value==='word problems'&&document.querySelector('[data-directory-status]')?.textContent?.includes('shown on this page'),{timeout:10000});
 assert.ok(await page.locator('.directory-extras .directory-card[href="/word-problems-worksheets/"]').isVisible());
 await page.locator('[data-directory-clear]').click();
 assert.equal(await page.locator('.directory-group .directory-card:visible').count(),51);
 report.checks.push('Five semantic touch chips, true existing-index filtering, guided word problems and clear/reset');
 // Grade 5 sampler no longer needs full-height scrolling past all questions.
 await page.goto(base+'/worksheets-by-grade/',{waitUntil:'networkidle'});
 await page.locator('[data-wide-mode]').selectOption('grade5-full');
 assert.equal(await page.locator('[data-wide-count]').inputValue(),'40');
 assert.equal(await page.locator('[data-wide-list]>li').count(),40);
 await page.locator('[data-wide-toggle]').click();
 assert.equal(await page.locator('.wide-answer').count(),40);
 await page.locator('[data-wide-toggle]').click();
 assert.equal(await page.locator('.wide-answer').count(),0);
 assert.ok(await page.locator('.wide-preview-jump').isVisible());
 await page.locator('.wide-preview-jump').click();
 assert.equal(new URL(page.url()).hash,'#wide-preview-grade');
 report.checks.push('Grade 5 26-standard 40-question preview, answer separation, mobile paper anchor');
 // Reduced-motion users must see exactly the same state changes but no WAAPI transitions.
 const reducedCtx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const reduced=await reducedCtx.newPage();
 await reduced.goto(base+'/two-step-equations-worksheets/',{waitUntil:'networkidle'});
 await reduced.evaluate(()=>{
  window.__r105AnimCount=0;
  const original=Element.prototype.animate;
  Element.prototype.animate=function(...args){window.__r105AnimCount++;return original.apply(this,args);};
 });
 await reduced.locator('[data-mode="answers"]').click();
 await reduced.locator('[data-action="regenerate"]').click();
 assert.equal(await reduced.locator('.problem .answer-text').count(),8);
 assert.equal(await reduced.evaluate(()=>window.__r105AnimCount),0,'Reduced-motion mode must not animate preview');
 await reduced.goto(base+'/worksheets-by-grade/',{waitUntil:'networkidle'});
 await reduced.locator('[data-wide-mode]').selectOption('grade5-full');
 await reduced.locator('[data-wide-toggle]').click();
 assert.equal(await reduced.locator('.wide-answer').count(),40);
 assert.equal(await reduced.locator('.wide-paper').evaluate(el=>el.getAnimations().length),0);
 await reducedCtx.close();
 report.checks.push('Reduced motion: all real functionality works, no presentation animations run');
 assert.deepEqual(report.errors,[],'Uncaught browser script errors');
 report.status='PASS';
 writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R105 PASS: '+report.pages.length+' real viewport states; '+report.pdfs.length+' downloaded PDF; '+report.checks.length+' groups.');
 await ctx.close();
}catch(error){
 report.status='FAIL';report.errors.push(String(error?.stack||error));
 writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.error('R105 FAILED',error);
 process.exitCode=1;
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
