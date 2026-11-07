/** R93 responsive & accessibility browser gate on the real built SSG.
 * An automated rule/sample check; does not claim screen-reader or human UX QA.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createReadStream,existsSync,mkdirSync,statSync,writeFileSync} from 'node:fs';
import {join,resolve,sep,extname} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('dist'),out=resolve('qa-artifacts/r93-ui-a11y');
assert.ok(existsSync(join(root,'index.html')));
mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript',
 '.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml',
 '.json':'application/json','.png':'image/png'};
const srv=createServer((req,res)=>{
 try{
  const p=new URL(req.url??'/', 'http://localhost').pathname;
  let file=resolve(root,'.'+decodeURIComponent(p));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return}
  if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');
  if(!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream'});
  createReadStream(file).pipe(res);
 }catch(e){res.writeHead(400);res.end(String(e))}
});
await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+srv.address().port;
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable',
 '/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean).find(existsSync);
assert.ok(chrome,'CI Chromium runtime required');
let browser,ctx;
const results=[],failures=[],browserErrors=[];
try{
 browser=await chromium.launch({executablePath:chrome,headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage']});
 ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 page.on('pageerror',e=>browserErrors.push(e.message));
 const widths=[360,390,768,1280,1440];
 const paths=['/','/worksheets/','/two-step-equations-worksheets/',
  '/fractions-worksheets/','/box-plots-worksheets/','/printable-protractor/','/terms/'];
 for(const width of widths){
  await page.setViewportSize({width,height:900});
  for(const path of paths){
   const resp=await page.goto(base+path,{waitUntil:'networkidle',timeout:30000});
   assert.equal(resp?.status(),200);
   const metrics=await page.evaluate(()=>{
    const html=document.documentElement,body=document.body;
    const controls=[...document.querySelectorAll('input,select,textarea')].filter(el=>{
     const rect=el.getBoundingClientRect(),css=getComputedStyle(el);
     return rect.width>0&&rect.height>0&&css.visibility!=='hidden'&&css.display!=='none';
    });
    const unnamed=controls.filter(el=>
     !el.labels?.length&&!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby'));
    const links=[...document.querySelectorAll('a')].filter(a=>{
     const rect=a.getBoundingClientRect();return rect.width>0&&rect.height>0;
    });
    const namelessLinks=links.filter(a=>!a.textContent?.trim()&&!a.getAttribute('aria-label')&&
     !a.querySelector('img[alt]'));
    const images=[...document.querySelectorAll('img')].filter(i=>i.getAttribute('alt')===null);
    const headings=[...document.querySelectorAll('h1')].map(x=>x.textContent?.trim());
    const focusable=[...document.querySelectorAll('button,a,input,select')].filter(x=>
     x.getBoundingClientRect().width>0);
    return {viewport:window.innerWidth,scrollWidth:Math.max(html.scrollWidth,body.scrollWidth),
     unnamed:unnamed.map(x=>x.outerHTML.slice(0,180)),
     namelessLinks:namelessLinks.map(x=>x.outerHTML.slice(0,160)),
     missingAlt:images.map(x=>x.outerHTML.slice(0,150)),
     headingCount:headings.length,activeControls:focusable.length,
     hasSkipLink:!!document.querySelector('.skip-link[href="#main-content"]'),
     robots:document.querySelector('meta[name="robots"]')?.content};
   });
   const row={width,path,...metrics};
   results.push(row);
   if(metrics.scrollWidth>width+2)failures.push({...row,reason:'horizontal page overflow'});
   if(metrics.unnamed.length)failures.push({...row,reason:'controls lack accessible names'});
   if(metrics.namelessLinks.length)failures.push({...row,reason:'links lack accessible names'});
   if(metrics.missingAlt.length)failures.push({...row,reason:'images missing alt'});
   if(metrics.headingCount!==1)failures.push({...row,reason:'expected one page H1'});
   if(!metrics.hasSkipLink)failures.push({...row,reason:'missing keyboard skip link'});
   if(metrics.robots!=='noindex,nofollow')failures.push({...row,reason:'preview indexed'});
   if([360,768,1440].includes(width)&&
    ['/','/worksheets/','/two-step-equations-worksheets/'].includes(path)){
    await page.screenshot({
     path:join(out,path==='/'?'home-'+width+'.png':path.slice(1).replaceAll('/','-')+'-'+width+'.png'),
     fullPage:false});
   }
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/two-step-equations-worksheets/',{waitUntil:'networkidle'});
 await page.keyboard.press('Tab');
 assert.equal(await page.locator(':focus').getAttribute('class'),'skip-link',
  'Keyboard Tab must reveal skip link on worksheet');
 await page.keyboard.press('Enter');
 assert.equal(await page.locator(':focus').getAttribute('id'),'main-content',
  'Skip link must move focus to main');
 await page.locator('[data-action="regenerate"]').focus();
 await page.keyboard.press('Enter');
 assert.equal(await page.locator('.problem').count(),8);
 await page.locator('[data-mode="answers"]').focus();
 await page.keyboard.press('Enter');
 assert.equal(await page.locator('.problem .answer-text').count(),8);
 await page.locator('[data-mode="questions"]').focus();
 await page.keyboard.press('Enter');
 assert.equal(await page.locator('.problem .answer-text').count(),0);
 const motion=await page.evaluate(()=>({
  matches:matchMedia('(prefers-reduced-motion: reduce)').matches,
  buttonTransition:getComputedStyle(document.querySelector('.btn-primary')).transitionDuration
 }));
 assert.ok(motion.matches,'Reduced motion device preference not recognized');
 if(browserErrors.length)failures.push({reason:'uncaught script errors',errors:browserErrors});
 const status=failures.length?'FAIL':'PASS';
 writeFileSync(join(out,'ui-a11y-audit.json'),JSON.stringify({
  schema:'mathworks-r93-browser-responsive-a11y/v1',
  status,viewports:widths,routes:paths,
  screenshotPolicy:'Rendered at 360, 768 and 1440 where relevant; representative examples only',
  checks:results.length,results,failures,keyboard:{
   skipLink:'PASS',generate:'PASS',answerReveal:'PASS',answerHide:'PASS'},reducedMotion:motion,
  humanScreenReader:'NOT RUN',humanWCAGAA:'NOT RUN',
  domainLighthouseAndCoreWebVitals:'NOT RUN'
 },null,2)+'\n');
 assert.equal(failures.length,0,'R93 responsive/a11y regression '+JSON.stringify(failures.slice(0,5)));
 console.log('R93 35 browser responsive+accessibility page states PASS; keyboard and reduced motion tested');
}catch(error){
 writeFileSync(join(out,'failure.json'),JSON.stringify({
  error:String(error?.stack??error),results:results.length,failures:failures.slice(0,20)},null,2));
 throw error;
}finally{
 if(ctx)await ctx.close();
 if(browser)await browser.close();
 await new Promise(resolve=>srv.close(resolve));
}
