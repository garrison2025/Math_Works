/** R104 UI engineering QA on the exact static Astro bundle. Not a human design review. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createReadStream,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve('dist'),out=resolve('qa-artifacts/r104-ui');
assert.ok(existsSync(join(root,'index.html')),'Astro dist/ missing');
mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server=createServer((req,res)=>{
 try{
  const path=new URL(req.url||'/','http://localhost').pathname;
  let file=resolve(root,'.'+decodeURIComponent(path));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');
  if(!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'});
  createReadStream(file).pipe(res);
 }catch(e){res.writeHead(400);res.end(String(e));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const exe=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean).find(existsSync);
const report={schema:'r104-ui-refresh/v1',base:'built Astro dist (not production)',viewports:[],failures:[],screenshots:[],checks:[],externalRequests:[],runtimeErrors:[]};
let browser;
const check=(ok,label,extra)=>{if(!ok)report.failures.push({label,extra});};
try{
 assert.ok(exe,'Google Chrome or Chromium is required for real UI QA');
 browser=await chromium.launch({headless:true,executablePath:exe,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'no-preference'});
 const page=await context.newPage();
 page.on('pageerror',e=>report.runtimeErrors.push(String(e)));
 page.on('request',req=>{if(!req.url().startsWith(base)&&!req.url().startsWith('data:'))report.externalRequests.push(req.url());});
 const paths=['/','/worksheets/','/two-step-equations-worksheets/','/worksheets-by-grade/'];
 const widths=[320,360,390,768,1024,1440];
 for(const width of widths){
  await page.setViewportSize({width,height:900});
  for(const path of paths){
   const res=await page.goto(base+path,{waitUntil:'networkidle',timeout:40000});
   check(res?.status()===200,'route HTTP 200',{width,path,status:res?.status()});
   const measure=await page.evaluate(()=>{
    const html=document.documentElement,body=document.body;
    const h1s=[...document.querySelectorAll('h1')];
    const nav=document.querySelector('.header-nav .nav-pill')?.getBoundingClientRect();
    const input=[...document.querySelectorAll('a,button,input,select')].filter(x=>x.getBoundingClientRect().width>0);
    return {viewport:innerWidth,scrollWidth:Math.max(html.scrollWidth,body.scrollWidth),
      h1Count:h1s.length,navbarVisible:!!nav&&nav.width>0&&nav.x>=0&&nav.right<=innerWidth+2,
      index:document.querySelector('meta[name=robots]')?.getAttribute('content'),
      focusableCount:input.length,imagesWithoutAlt:[...document.images].filter(x=>x.getAttribute('alt')===null).length};
   });
   check(measure.scrollWidth<=width+2,'horizontal overflow',{width,path,...measure});
   check(measure.h1Count===1,'exactly one H1',{width,path,...measure});
   check(measure.navbarVisible,'mobile/desktop primary navigation visible',{width,path,...measure});
   check(measure.index==='noindex,nofollow','preview SEO index protection',{width,path,...measure});
   check(!measure.imagesWithoutAlt,'images without alt',{width,path,...measure});
   report.viewports.push({width,path,...measure});
   if(path==='/'&&[360,768,1440].includes(width)){
    const filename='home-'+width+'.png';
    await page.screenshot({path:join(out,filename),fullPage:false,animations:'disabled'});
    report.screenshots.push(filename);
   }
   if(path==='/two-step-equations-worksheets/'&&width===390){
    await page.screenshot({path:join(out,'tool-390.png'),fullPage:false,animations:'disabled'});
    report.screenshots.push('tool-390.png');
   }
   if(path==='/worksheets/'&&width===1280){
    await page.screenshot({path:join(out,'library-1280.png'),fullPage:false,animations:'disabled'});
    report.screenshots.push('library-1280.png');
   }
  }
 }
 await page.goto(base+'/',{waitUntil:'networkidle'});
 check(await page.locator('.hero-illustration .hero-preview-window').isVisible(),'CSS hero preview visible');
 check(await page.locator('.topic-group').count()===4,'four math categories');
 check(await page.locator('.topic-card').count()===51,'all 51 original topic cards retained');
 check(await page.locator('.pathway-card').count()===4,'grade/story/algebra/geometry navigation retained');
 check(await page.locator('#try-a-worksheet [data-workspace]').count()===1,'homepage generator retained');
 const btn=page.locator('.hero-primary');
 check((await btn.getAttribute('href'))==='/worksheets/','hero CTA leads to real directory');
 await page.locator('.hero-secondary').click();
 check(new URL(page.url()).hash==='#try-a-worksheet','sample scroll anchor');
 await page.locator('[data-action=regenerate]').click();
 check(await page.locator('.problem').count()===8,'homepage live generator still works');
 await page.locator('[data-mode=answers]').click();
 check(await page.locator('.problem .answer-text').count()===8,'real answers still display');
 const noMotion=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});
 const reduced=await noMotion.newPage();
 await reduced.goto(base+'/',{waitUntil:'networkidle'});
 const motion=await reduced.evaluate(()=>({
   preference:matchMedia('(prefers-reduced-motion: reduce)').matches,
   animation:getComputedStyle(document.querySelector('.hero-preview-window')).animationName,
   floatAnimation:getComputedStyle(document.querySelector('.hero-float-key')).animationName,
   htmlScroll:getComputedStyle(document.documentElement).scrollBehavior
 }));
 check(motion.preference&&motion.animation==='none'&&motion.floatAnimation==='none'&&motion.htmlScroll==='auto',
  'reduced motion suppresses hero animations and smooth scroll',motion);
 await noMotion.close();
 check(!report.runtimeErrors.length,'no uncaught page scripts',report.runtimeErrors);
 check(!report.externalRequests.length,'no new off-site UI dependencies',report.externalRequests);
 report.checks.push('24 responsive page states at 320-1440px; 51 core routes; live generator; mobile nav; animation and reduced motion');
 report.status=report.failures.length?'FAIL':'PASS';
 writeFileSync(join(out,'summary.json'),JSON.stringify(report,null,2)+'\n');
 assert.equal(report.failures.length,0,JSON.stringify(report.failures.slice(0,8)));
 console.log('R104 UI QA PASS, '+report.viewports.length+' browser viewport states, '+report.screenshots.length+' screenshots');
 await context.close();
}catch(e){
 report.status='FAIL';
 report.failures.push({error:String(e?.stack||e)});
 writeFileSync(join(out,'summary.json'),JSON.stringify(report,null,2)+'\n');
 console.error('R104 UI QA FAIL',e);
 process.exitCode=1;
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
